import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.utils.currency import round_decimal
from app.utils.datetime import utc_now


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    icon: str
    color: str
    is_default: bool

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Monetary amount strictly greater than zero")
    currency: str = Field(default="USD", max_length=10)
    category: str = Field(..., min_length=1, max_length=100)
    merchant: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    occurred_at: datetime = Field(default_factory=utc_now)
    source: str = Field(default="web", max_length=50)

    @field_validator("amount", mode="after")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        return round_decimal(v)


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = Field(default=None, gt=Decimal("0.00"))
    currency: Optional[str] = Field(default=None, max_length=10)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    merchant: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    occurred_at: Optional[datetime] = None

    @field_validator("amount", mode="after")
    @classmethod
    def validate_amount(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None:
            return round_decimal(v)
        return None


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    amount: Decimal
    currency: str
    category_id: Optional[uuid.UUID] = None
    category: str
    merchant: Optional[str] = None
    description: Optional[str] = None
    occurred_at: datetime
    source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpenseFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    category: Optional[str] = None
    merchant: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total: int
    limit: int
    offset: int
