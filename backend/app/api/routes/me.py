from fastapi import APIRouter, Depends

from app.api.deps import AuthenticatedUser, get_current_user
from app.schemas.auth import MeResponse

router = APIRouter()


@router.get("", response_model=MeResponse)
def me(current_user: AuthenticatedUser = Depends(get_current_user)) -> MeResponse:
    user = current_user.user
    return MeResponse(
        telegram_id=user.telegram_id,
        role=user.role,
        full_name=user.full_name,
        username=user.username,
        assigned_store_ids=current_user.assigned_store_ids,
    )
