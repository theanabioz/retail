import hashlib
import hmac
import json
from time import time
from urllib.parse import parse_qsl

from app.config import get_settings


class TelegramAuthError(Exception):
    pass


def validate_telegram_init_data(init_data: str) -> dict:
    settings = get_settings()

    if not settings.telegram_bot_token:
        raise TelegramAuthError("TELEGRAM_BOT_TOKEN is not configured.")

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)

    if not received_hash:
        raise TelegramAuthError("Telegram hash is missing.")

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(parsed.items()))

    secret_key = hmac.new(
        key=b"WebAppData",
        msg=settings.telegram_bot_token.encode(),
        digestmod=hashlib.sha256,
    ).digest()
    expected_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise TelegramAuthError("Telegram init data signature is invalid.")

    auth_date = int(parsed.get("auth_date", "0"))
    if auth_date <= 0:
        raise TelegramAuthError("auth_date is missing.")

    age_seconds = int(time()) - auth_date
    if age_seconds > settings.telegram_auth_max_age_seconds:
        raise TelegramAuthError("Telegram init data has expired.")

    user_raw = parsed.get("user")
    if not user_raw:
        raise TelegramAuthError("Telegram user payload is missing.")

    user = json.loads(user_raw)
    return {
        "telegram_id": str(user["id"]),
        "first_name": user.get("first_name"),
        "last_name": user.get("last_name"),
        "username": user.get("username"),
    }
