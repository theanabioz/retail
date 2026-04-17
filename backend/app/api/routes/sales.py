from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.models.retail import ActivityEvent, InventoryBalance, Product, Sale, SaleItem, Shift, Store
from app.schemas.sales import CreateSaleRequest, SaleItemResponse, SaleResponse, SalesQueryResponse

router = APIRouter()


def serialize_sale(sale: Sale, store_name: str, product_names: dict[str, str]) -> SaleResponse:
    return SaleResponse(
        id=sale.id,
        store_id=sale.store_id,
        store_name=store_name,
        seller_id=sale.seller_id,
        total_amount=sale.total_amount,
        payment_method=sale.payment_method,
        status=sale.status,
        created_at=sale.created_at.isoformat(),
        items=[
            SaleItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=product_names.get(item.product_id, "Unknown Product"),
                quantity=item.quantity,
                base_price=item.base_price,
                sold_price=item.sold_price,
                line_total=item.line_total,
            )
            for item in sale.items
        ],
    )


def get_active_shift(db: Session, seller_id: str, store_id: str) -> Optional[Shift]:
    return (
        db.query(Shift)
        .filter(
            Shift.seller_id == seller_id,
            Shift.store_id == store_id,
            Shift.ended_at.is_(None),
        )
        .order_by(Shift.started_at.desc())
        .first()
    )


@router.get("", response_model=SalesQueryResponse)
def list_sales(
    store_id: Optional[str] = Query(default=None),
    from_date: Optional[str] = Query(default=None),
    to_date: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SalesQueryResponse:
    query = db.query(Sale).options(joinedload(Sale.items)).order_by(Sale.created_at.desc())

    allowed_store_ids = current_user.assigned_store_ids if current_user.user.role == "seller" else None
    if current_user.user.role == "seller":
        query = query.filter(Sale.store_id.in_(allowed_store_ids))

    if store_id:
        if allowed_store_ids is not None and store_id not in allowed_store_ids:
            raise HTTPException(status_code=403, detail="Store access denied.")
        query = query.filter(Sale.store_id == store_id)

    if from_date:
        start = datetime.fromisoformat(f"{from_date}T00:00:00")
        query = query.filter(Sale.created_at >= start)

    if to_date:
        end = datetime.fromisoformat(f"{to_date}T00:00:00") + timedelta(days=1)
        query = query.filter(Sale.created_at < end)

    sales = query.all()
    store_ids = sorted({sale.store_id for sale in sales})
    product_ids = sorted({item.product_id for sale in sales for item in sale.items})

    stores = db.query(Store).filter(Store.id.in_(store_ids)).all() if store_ids else []
    products = db.query(Product).filter(Product.id.in_(product_ids)).all() if product_ids else []
    store_names = {store.id: store.name for store in stores}
    product_names = {product.id: product.name for product in products}

    return SalesQueryResponse(
        sales=[serialize_sale(sale, store_names.get(sale.store_id, "Unknown Store"), product_names) for sale in sales]
    )


@router.post("", response_model=SaleResponse)
def create_sale(
    payload: CreateSaleRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SaleResponse:
    if current_user.user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create sales.")

    if payload.store_id not in current_user.assigned_store_ids:
        raise HTTPException(status_code=403, detail="Store access denied.")

    shift = get_active_shift(db, current_user.user.id, payload.store_id)
    if not shift:
        raise HTTPException(status_code=409, detail="An active shift is required to create a sale.")

    if shift.status == "on_break":
        raise HTTPException(status_code=409, detail="Cannot create a sale while the shift is on break.")

    product_ids = [item.product_id for item in payload.items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    product_map = {product.id: product for product in products}

    if len(product_map) != len(set(product_ids)):
        raise HTTPException(status_code=404, detail="One or more products were not found.")

    balances = (
        db.query(InventoryBalance)
        .filter(
            InventoryBalance.store_id == payload.store_id,
            InventoryBalance.product_id.in_(product_ids),
        )
        .all()
    )
    balance_map = {balance.product_id: balance for balance in balances}

    line_items: list[SaleItem] = []
    total_amount = Decimal("0.00")
    for item in payload.items:
        balance = balance_map.get(item.product_id)
        if not balance:
            raise HTTPException(status_code=404, detail="Inventory row not found for one or more products.")
        if balance.quantity < item.quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Not enough stock for {product_map[item.product_id].name}.",
            )

        product = product_map[item.product_id]
        line_total = Decimal(item.quantity) * item.sold_price
        total_amount += line_total
        balance.quantity -= item.quantity
        line_items.append(
            SaleItem(
                id=str(uuid4()),
                product_id=item.product_id,
                quantity=item.quantity,
                base_price=product.default_price,
                sold_price=item.sold_price,
                line_total=line_total,
            )
        )

    sale = Sale(
        id=str(uuid4()),
        store_id=payload.store_id,
        seller_id=current_user.user.id,
        payment_method=payload.payment_method,
        total_amount=total_amount,
        status="completed",
        created_at=datetime.utcnow(),
    )
    db.add(sale)
    db.flush()

    for line_item in line_items:
        line_item.sale_id = sale.id
        db.add(line_item)

    db.add(
        ActivityEvent(
            seller_id=current_user.user.id,
            store_id=payload.store_id,
            event_type="sale",
            title="Sale completed",
            meta=f"EUR {total_amount:.2f}",
            created_at=sale.created_at,
        )
    )
    db.commit()

    store = db.query(Store).filter(Store.id == payload.store_id).first()
    db.refresh(sale)
    sale = db.query(Sale).options(joinedload(Sale.items)).filter(Sale.id == sale.id).first()
    product_names = {product.id: product.name for product in products}
    return serialize_sale(sale, store.name if store else "Unknown Store", product_names)
