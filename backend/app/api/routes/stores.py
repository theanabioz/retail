from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.models.retail import InventoryBalance, Product, Store
from app.schemas.admin import CreateStoreRequest, UpdateStoreRequest
from app.schemas.catalog import StoreResponse

router = APIRouter()


@router.get("", response_model=list[StoreResponse])
def list_stores(db: Session = Depends(get_db)) -> list[StoreResponse]:
    stores = db.query(Store).filter(Store.is_active.is_(True)).order_by(Store.name.asc()).all()
    return [StoreResponse.model_validate(store) for store in stores]


@router.post("", response_model=StoreResponse)
def create_store(
    payload: CreateStoreRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> StoreResponse:
    if current_user.user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    existing = db.query(Store).filter(Store.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="A store with this name already exists.")

    store = Store(id=str(uuid4()), name=payload.name, address=payload.address, is_active=True)
    db.add(store)
    db.flush()

    products = db.query(Product).all()
    db.add_all(
        [
            InventoryBalance(id=str(uuid4()), store_id=store.id, product_id=product.id, quantity=0)
            for product in products
        ]
    )

    db.commit()
    db.refresh(store)
    return StoreResponse.model_validate(store)


@router.patch("/{store_id}", response_model=StoreResponse)
def update_store(
    store_id: str,
    payload: UpdateStoreRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> StoreResponse:
    if current_user.user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found.")

    if payload.name is not None:
        store.name = payload.name
    if payload.address is not None:
        store.address = payload.address
    if payload.is_active is not None:
        store.is_active = payload.is_active

    db.commit()
    db.refresh(store)
    return StoreResponse.model_validate(store)
