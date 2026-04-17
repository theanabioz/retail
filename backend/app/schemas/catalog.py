from decimal import Decimal

from pydantic import BaseModel


class StoreResponse(BaseModel):
    id: str
    name: str
    address: str
    is_active: bool

    model_config = {"from_attributes": True}


class ProductResponse(BaseModel):
    id: str
    name: str
    barcode: str
    default_price: Decimal
    is_active: bool

    model_config = {"from_attributes": True}


class InventoryBalanceResponse(BaseModel):
    store_id: str
    product_id: str
    quantity: int

    model_config = {"from_attributes": True}
