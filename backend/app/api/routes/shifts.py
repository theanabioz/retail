from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.models.retail import ActivityEvent, BreakEntry, Shift
from app.schemas.shift import BreakActionResponse, BreakResponse, CurrentShiftResponse, StartShiftRequest

router = APIRouter()


def serialize_break(entry: BreakEntry) -> BreakResponse:
    return BreakResponse(
        id=entry.id,
        started_at=entry.started_at.isoformat(),
        ended_at=entry.ended_at.isoformat() if entry.ended_at else None,
    )


def serialize_shift(shift: Shift) -> CurrentShiftResponse:
    return CurrentShiftResponse(
        id=shift.id,
        store_id=shift.store_id,
        seller_id=shift.seller_id,
        status=shift.status,
        started_at=shift.started_at.isoformat(),
        ended_at=shift.ended_at.isoformat() if shift.ended_at else None,
        breaks=[serialize_break(entry) for entry in shift.breaks],
    )


def get_active_shift(db: Session, seller_id: str) -> Optional[Shift]:
    return (
        db.query(Shift)
        .filter(Shift.seller_id == seller_id, Shift.ended_at.is_(None))
        .order_by(Shift.started_at.desc())
        .first()
    )


@router.get("/current", response_model=Optional[CurrentShiftResponse])
def current_shift(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Optional[CurrentShiftResponse]:
    shift = get_active_shift(db, current_user.user.id)
    if not shift:
        return None
    return serialize_shift(shift)


@router.post("/start", response_model=CurrentShiftResponse)
def start_shift(
    payload: StartShiftRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CurrentShiftResponse:
    if current_user.user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can start shifts.")

    if payload.store_id not in current_user.assigned_store_ids:
        raise HTTPException(status_code=403, detail="Store access denied.")

    existing_shift = get_active_shift(db, current_user.user.id)
    if existing_shift:
        raise HTTPException(status_code=409, detail="An active shift already exists.")

    shift = Shift(
        seller_id=current_user.user.id,
        store_id=payload.store_id,
        started_at=datetime.utcnow(),
        status="active",
    )
    db.add(shift)
    db.flush()

    db.add(
        ActivityEvent(
            seller_id=current_user.user.id,
            store_id=payload.store_id,
            event_type="shift_start",
            title="Shift started",
            meta="Shift opened",
            created_at=shift.started_at,
        )
    )
    db.commit()
    db.refresh(shift)
    return serialize_shift(shift)


@router.post("/end", response_model=CurrentShiftResponse)
def end_shift(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CurrentShiftResponse:
    shift = get_active_shift(db, current_user.user.id)
    if not shift:
        raise HTTPException(status_code=404, detail="No active shift found.")

    now = datetime.utcnow()
    open_break = next((entry for entry in shift.breaks if entry.ended_at is None), None)
    if open_break:
        open_break.ended_at = now

    shift.ended_at = now
    shift.status = "ended"

    db.add(
        ActivityEvent(
            seller_id=current_user.user.id,
            store_id=shift.store_id,
            event_type="shift_end",
            title="Shift ended",
            meta="Shift closed",
            created_at=now,
        )
    )
    db.commit()
    db.refresh(shift)
    return serialize_shift(shift)


@router.post("/break/start", response_model=BreakActionResponse)
def start_break(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> BreakActionResponse:
    shift = get_active_shift(db, current_user.user.id)
    if not shift:
        raise HTTPException(status_code=404, detail="No active shift found.")

    open_break = next((entry for entry in shift.breaks if entry.ended_at is None), None)
    if open_break:
        raise HTTPException(status_code=409, detail="A break is already active.")

    break_entry = BreakEntry(shift_id=shift.id, started_at=datetime.utcnow())
    shift.status = "on_break"
    db.add(break_entry)
    db.flush()

    db.add(
        ActivityEvent(
            seller_id=current_user.user.id,
            store_id=shift.store_id,
            event_type="break_start",
            title="Break started",
            meta="On break",
            created_at=break_entry.started_at,
        )
    )
    db.commit()
    db.refresh(shift)
    db.refresh(break_entry)
    return BreakActionResponse(shift=serialize_shift(shift), break_entry=serialize_break(break_entry))


@router.post("/break/end", response_model=BreakActionResponse)
def end_break(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> BreakActionResponse:
    shift = get_active_shift(db, current_user.user.id)
    if not shift:
        raise HTTPException(status_code=404, detail="No active shift found.")

    break_entry = next((entry for entry in shift.breaks if entry.ended_at is None), None)
    if not break_entry:
        raise HTTPException(status_code=404, detail="No active break found.")

    break_entry.ended_at = datetime.utcnow()
    shift.status = "active"

    db.add(
        ActivityEvent(
            seller_id=current_user.user.id,
            store_id=shift.store_id,
            event_type="break_end",
            title="Break ended",
            meta="Back on shift",
            created_at=break_entry.ended_at,
        )
    )
    db.commit()
    db.refresh(shift)
    db.refresh(break_entry)
    return BreakActionResponse(shift=serialize_shift(shift), break_entry=serialize_break(break_entry))
