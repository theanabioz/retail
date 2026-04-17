from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field


class SaleItemRequest(BaseModel):
    product_id: str
    quantity: int = Field(ge=1)
    sold_price: Decimal = Field(ge=0)


class CreateSaleRequest(BaseModel):
    store_id: str
    payment_method: Literal["card", "cash"]
    items: list[SaleItemRequest] = Field(min_length=1)


class SaleItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity: int
    base_price: Decimal
    sold_price: Decimal
    line_total: Decimal


class SaleResponse(BaseModel):
    id: str
    store_id: str
    store_name: str
    seller_id: str
    total_amount: Decimal
    payment_method: str
    status: str
    created_at: str
    items: list[SaleItemResponse]


class SalesQueryResponse(BaseModel):
    sales: list[SaleResponse]


class SalesQueryParams(BaseModel):
    store_id: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None
