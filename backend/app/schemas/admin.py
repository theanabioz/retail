from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field


class CreateStoreRequest(BaseModel):
    name: str
    address: str


class CreateProductRequest(BaseModel):
    name: str
    barcode: str
    default_price: Decimal = Field(ge=0)


class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    barcode: Optional[str] = None
    default_price: Optional[Decimal] = Field(default=None, ge=0)
    is_active: Optional[bool] = None


class UpdateInventoryRequest(BaseModel):
    quantity: int = Field(ge=0)


class StaffResponse(BaseModel):
    id: str
    telegram_id: str
    full_name: str
    username: Optional[str] = None
    role: str
    is_active: bool
    assigned_store_ids: list[str]
    latest_shift_status: Literal["online", "offline"]
    joined_date: str


class CreateStaffRequest(BaseModel):
    telegram_id: str
    full_name: str
    username: Optional[str] = None
    role: Literal["admin", "seller"] = "seller"
    store_id: str


class UpdateStaffRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None
    store_id: Optional[str] = None


class UpdateStoreRequest(BaseModel):
    is_active: Optional[bool] = None
    name: Optional[str] = None
    address: Optional[str] = None


class StaffShiftResponse(BaseModel):
    id: str
    store_id: str
    started_at: str
    ended_at: Optional[str] = None


class StaffActivityResponse(BaseModel):
    id: str
    event_type: str
    title: str
    meta: Optional[str] = None
    created_at: str
