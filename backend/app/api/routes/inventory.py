from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.models.retail import InventoryBalance
from app.schemas.admin import UpdateInventoryRequest
from app.schemas.catalog import InventoryBalanceResponse

router = APIRouter()


@router.get("", response_model=list[InventoryBalanceResponse])
def list_inventory(db: Session = Depends(get_db)) -> list[InventoryBalanceResponse]:
    balances = db.query(InventoryBalance).all()
    return [InventoryBalanceResponse.model_validate(balance) for balance in balances]


@router.put("/{store_id}/{product_id}", response_model=InventoryBalanceResponse)
def update_inventory_quantity(
    store_id: str,
    product_id: str,
    payload: UpdateInventoryRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> InventoryBalanceResponse:
    if current_user.user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    balance = (
        db.query(InventoryBalance)
        .filter(InventoryBalance.store_id == store_id, InventoryBalance.product_id == product_id)
        .first()
    )
    if not balance:
        raise HTTPException(status_code=404, detail="Inventory balance not found.")

    balance.quantity = payload.quantity
    db.commit()
    db.refresh(balance)
    return InventoryBalanceResponse.model_validate(balance)
