from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.models.retail import InventoryBalance, Product, Store
from app.schemas.admin import CreateProductRequest, UpdateProductRequest
from app.schemas.catalog import ProductResponse

router = APIRouter()


@router.get("", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)) -> list[ProductResponse]:
    products = db.query(Product).filter(Product.is_active.is_(True)).order_by(Product.name.asc()).all()
    return [ProductResponse.model_validate(product) for product in products]


@router.post("", response_model=ProductResponse)
def create_product(
    payload: CreateProductRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ProductResponse:
    if current_user.user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    existing = db.query(Product).filter(Product.barcode == payload.barcode).first()
    if existing:
        raise HTTPException(status_code=409, detail="A product with this barcode already exists.")

    product = Product(
        id=str(uuid4()),
        name=payload.name,
        barcode=payload.barcode,
        default_price=Decimal(payload.default_price),
        is_active=True,
    )
    db.add(product)
    db.flush()

    stores = db.query(Store).all()
    db.add_all(
        [
            InventoryBalance(id=str(uuid4()), store_id=store.id, product_id=product.id, quantity=0)
            for store in stores
        ]
    )
    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: UpdateProductRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ProductResponse:
    if current_user.user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if payload.barcode is not None and payload.barcode != product.barcode:
        existing = db.query(Product).filter(Product.barcode == payload.barcode).first()
        if existing:
            raise HTTPException(status_code=409, detail="A product with this barcode already exists.")
        product.barcode = payload.barcode
    if payload.name is not None:
        product.name = payload.name
    if payload.default_price is not None:
        product.default_price = Decimal(payload.default_price)
    if payload.is_active is not None:
        product.is_active = payload.is_active

    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)
