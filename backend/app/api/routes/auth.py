from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import TelegramAuthRequest, TelegramAuthResponse
from app.services.telegram_auth import TelegramAuthError, validate_telegram_init_data

router = APIRouter()


@router.post("/telegram", response_model=TelegramAuthResponse)
def telegram_auth(payload: TelegramAuthRequest, db: Session = Depends(get_db)) -> TelegramAuthResponse:
    try:
        telegram_user = validate_telegram_init_data(payload.init_data)
    except TelegramAuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    user = db.query(User).filter(User.telegram_id == telegram_user["telegram_id"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=403, detail="User is not allowed to access this app.")

    return TelegramAuthResponse(
        telegram_id=user.telegram_id,
        role=user.role,
        is_active=user.is_active,
        full_name=user.full_name,
        assigned_store_ids=[assignment.store_id for assignment in user.store_assignments],
    )
