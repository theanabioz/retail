from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.models.retail import Product, Sale, Store
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    RevenueBucketResponse,
    StorePerformanceResponse,
    TimeRange,
    TopProductResponse,
)

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    time_range: TimeRange = Query(default="week", alias="range"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DashboardSummaryResponse:
    if current_user.user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    query = db.query(Sale).options(joinedload(Sale.items)).order_by(Sale.created_at.asc())
    now = datetime.utcnow()
    if time_range == "day":
        query = query.filter(Sale.created_at >= now - timedelta(days=1))
    elif time_range == "week":
        query = query.filter(Sale.created_at >= now - timedelta(days=7))
    elif time_range == "month":
        query = query.filter(Sale.created_at >= now - timedelta(days=30))

    sales = query.all()
    total_revenue = sum((sale.total_amount for sale in sales), Decimal("0.00"))

    if time_range == "day":
        buckets = {f"{hour:02d}:00": Decimal("0.00") for hour in range(24)}
        for sale in sales:
            buckets[f"{sale.created_at.hour:02d}:00"] += sale.total_amount
    elif time_range == "week":
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        buckets = {label: Decimal("0.00") for label in labels}
        for sale in sales:
            buckets[labels[sale.created_at.weekday()]] += sale.total_amount
    elif time_range == "month":
        buckets = {f"Week {index}": Decimal("0.00") for index in range(1, 5)}
        for sale in sales:
            week_index = min(4, ((sale.created_at.day - 1) // 7) + 1)
            buckets[f"Week {week_index}"] += sale.total_amount
    else:
        buckets = defaultdict(lambda: Decimal("0.00"))
        for sale in sales:
            buckets[str(sale.created_at.year)] += sale.total_amount
        buckets = dict(sorted(buckets.items(), key=lambda item: item[0]))

    sales_data = [RevenueBucketResponse(name=name, revenue=revenue) for name, revenue in buckets.items()]

    product_ids = {item.product_id for sale in sales for item in sale.items}
    products = db.query(Product).filter(Product.id.in_(product_ids)).all() if product_ids else []
    product_names = {product.id: product.name for product in products}
    product_totals: dict[str, dict[str, Decimal | int]] = defaultdict(lambda: {"sales": 0, "revenue": Decimal("0.00")})
    for sale in sales:
        for item in sale.items:
            stats = product_totals[item.product_id]
            stats["sales"] = int(stats["sales"]) + item.quantity
            stats["revenue"] = Decimal(stats["revenue"]) + item.line_total

    top_products = [
        TopProductResponse(
            name=product_names.get(product_id, "Unknown Product"),
            sales=int(stats["sales"]),
            revenue=Decimal(stats["revenue"]),
        )
        for product_id, stats in product_totals.items()
    ]
    top_products.sort(key=lambda item: item.sales, reverse=True)

    stores = db.query(Store).all()
    store_names = {store.id: store.name for store in stores}
    store_totals: dict[str, dict[str, Decimal | int]] = defaultdict(lambda: {"revenue": Decimal("0.00"), "sales_count": 0})
    for sale in sales:
        stats = store_totals[sale.store_id]
        stats["revenue"] = Decimal(stats["revenue"]) + sale.total_amount
        stats["sales_count"] = int(stats["sales_count"]) + 1

    store_performance = [
        StorePerformanceResponse(
            store_id=store_id,
            store_name=store_names.get(store_id, "Unknown Store"),
            revenue=Decimal(stats["revenue"]),
            sales_count=int(stats["sales_count"]),
        )
        for store_id, stats in store_totals.items()
    ]
    store_performance.sort(key=lambda item: item.revenue, reverse=True)

    return DashboardSummaryResponse(
        total_revenue=total_revenue,
        sales_data=sales_data,
        top_products=top_products[:3],
        store_performance=store_performance,
    )
