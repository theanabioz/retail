from dataclasses import dataclass
from typing import Annotated, Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.services.telegram_auth import TelegramAuthError, validate_telegram_init_data


@dataclass
class AuthenticatedUser:
    user: User
    assigned_store_ids: list[str]


def _build_authenticated_user(user: User) -> AuthenticatedUser:
    assigned_store_ids = [assignment.store_id for assignment in user.store_assignments]
    return AuthenticatedUser(user=user, assigned_store_ids=assigned_store_ids)


def get_current_user(
    db: Session = Depends(get_db),
    telegram_init_data: Annotated[Optional[str], Header(alias="X-Telegram-Init-Data")] = None,
    debug_telegram_id: Annotated[Optional[str], Header(alias="X-Debug-Telegram-Id")] = None,
) -> AuthenticatedUser:
    settings = get_settings()

    if telegram_init_data:
        try:
            telegram_user = validate_telegram_init_data(telegram_init_data)
        except TelegramAuthError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc

        user = db.query(User).filter(User.telegram_id == telegram_user["telegram_id"]).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=403, detail="User is not allowed to access this app.")

        return _build_authenticated_user(user)

    if settings.environment == "development" and debug_telegram_id:
        user = db.query(User).filter(User.telegram_id == debug_telegram_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=403, detail="Debug user is not allowed to access this app.")

        return _build_authenticated_user(user)

    raise HTTPException(status_code=401, detail="Authentication headers are missing.")
