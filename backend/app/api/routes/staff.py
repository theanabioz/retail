from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api.deps import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.models.retail import ActivityEvent, Shift, Store
from app.models.user import User, UserStoreAssignment
from app.schemas.admin import (
    CreateStaffRequest,
    StaffActivityResponse,
    StaffResponse,
    StaffShiftResponse,
    UpdateStaffRequest,
)

router = APIRouter()


def require_admin(current_user: AuthenticatedUser) -> None:
    if current_user.user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")


def serialize_staff(user: User, shift_status: str) -> StaffResponse:
    return StaffResponse(
        id=user.id,
        telegram_id=user.telegram_id,
        full_name=user.full_name,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        assigned_store_ids=[assignment.store_id for assignment in user.store_assignments],
        latest_shift_status=shift_status,
        joined_date=user.created_at.date().isoformat(),
    )


@router.get("", response_model=list[StaffResponse])
def list_staff(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[StaffResponse]:
    require_admin(current_user)
    users = (
        db.query(User)
        .options(joinedload(User.store_assignments))
        .filter(User.role == "seller", User.is_active.is_(True))
        .order_by(User.full_name.asc())
        .all()
    )
    active_shift_seller_ids = {
        seller_id
        for (seller_id,) in db.query(Shift.seller_id).filter(Shift.ended_at.is_(None)).all()
    }
    return [
        serialize_staff(user, "online" if user.id in active_shift_seller_ids else "offline")
        for user in users
    ]


@router.post("", response_model=StaffResponse)
def create_staff(
    payload: CreateStaffRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> StaffResponse:
    require_admin(current_user)
    existing = db.query(User).filter(User.telegram_id == payload.telegram_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="A user with this Telegram ID already exists.")

    store = db.query(Store).filter(Store.id == payload.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found.")

    user = User(
        id=str(uuid4()),
        telegram_id=payload.telegram_id,
        full_name=payload.full_name,
        username=payload.username,
        role=payload.role,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()
    db.add(UserStoreAssignment(user_id=user.id, store_id=payload.store_id))
    db.commit()
    db.refresh(user)
    return serialize_staff(user, "offline")


@router.patch("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: str,
    payload: UpdateStaffRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> StaffResponse:
    require_admin(current_user)
    user = db.query(User).options(joinedload(User.store_assignments)).filter(User.id == staff_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.username is not None:
        user.username = payload.username
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.store_id is not None:
        store = db.query(Store).filter(Store.id == payload.store_id).first()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found.")
        assignment = user.store_assignments[0] if user.store_assignments else None
        if assignment:
            assignment.store_id = payload.store_id
        else:
            db.add(UserStoreAssignment(user_id=user.id, store_id=payload.store_id))

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    active_shift = db.query(Shift).filter(Shift.seller_id == user.id, Shift.ended_at.is_(None)).first()
    return serialize_staff(user, "online" if active_shift else "offline")


@router.get("/{staff_id}/shifts", response_model=list[StaffShiftResponse])
def list_staff_shifts(
    staff_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[StaffShiftResponse]:
    require_admin(current_user)
    shifts = db.query(Shift).filter(Shift.seller_id == staff_id).order_by(Shift.started_at.desc()).all()
    return [
        StaffShiftResponse(
            id=shift.id,
            store_id=shift.store_id,
            started_at=shift.started_at.isoformat(),
            ended_at=shift.ended_at.isoformat() if shift.ended_at else None,
        )
        for shift in shifts
    ]


@router.get("/{staff_id}/activity", response_model=list[StaffActivityResponse])
def list_staff_activity(
    staff_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[StaffActivityResponse]:
    require_admin(current_user)
    events = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.seller_id == staff_id)
        .order_by(ActivityEvent.created_at.desc())
        .all()
    )
    return [
        StaffActivityResponse(
            id=event.id,
            event_type=event.event_type,
            title=event.title,
            meta=event.meta,
            created_at=event.created_at.isoformat(),
        )
        for event in events
    ]
