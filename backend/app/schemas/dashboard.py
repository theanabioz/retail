from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


TimeRange = Literal["day", "week", "month", "all"]


class RevenueBucketResponse(BaseModel):
    name: str
    revenue: Decimal


class TopProductResponse(BaseModel):
    name: str
    sales: int
    revenue: Decimal


class StorePerformanceResponse(BaseModel):
    store_id: str
    store_name: str
    revenue: Decimal
    sales_count: int


class DashboardSummaryResponse(BaseModel):
    total_revenue: Decimal
    sales_data: list[RevenueBucketResponse]
    top_products: list[TopProductResponse]
    store_performance: list[StorePerformanceResponse]
