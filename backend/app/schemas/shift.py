from typing import Literal, Optional

from pydantic import BaseModel


class BreakResponse(BaseModel):
    id: str
    started_at: str
    ended_at: Optional[str] = None


class CurrentShiftResponse(BaseModel):
    id: str
    store_id: str
    seller_id: str
    status: str
    started_at: str
    ended_at: Optional[str] = None
    breaks: list[BreakResponse]


class StartShiftRequest(BaseModel):
    store_id: str


class BreakActionResponse(BaseModel):
    shift: CurrentShiftResponse
    break_entry: Optional[BreakResponse] = None


ShiftStatus = Literal["active", "ended", "on_break"]
