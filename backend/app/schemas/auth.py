from typing import Optional

from pydantic import BaseModel


class TelegramAuthRequest(BaseModel):
    init_data: str


class TelegramUserPayload(BaseModel):
    telegram_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None


class TelegramAuthResponse(BaseModel):
    telegram_id: str
    role: str
    is_active: bool
    full_name: str
    assigned_store_ids: list[str]


class MeResponse(BaseModel):
    telegram_id: str
    role: str
    full_name: str
    username: Optional[str] = None
    assigned_store_ids: list[str]
