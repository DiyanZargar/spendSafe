from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class SpendingSummary(BaseModel):
    total_amount: Decimal
    transaction_count: int
    average_amount: Decimal
    currency: str


class CategoryBreakdown(BaseModel):
    category: str
    amount: Decimal
    percentage: float
    count: int


class SpendingTrendPoint(BaseModel):
    date: str
    amount: Decimal
    count: int


class DayOfWeekPoint(BaseModel):
    day: str
    amount: Decimal
    count: int


class TopMerchantPoint(BaseModel):
    merchant: str
    amount: Decimal
    count: int


class MonthlyComparison(BaseModel):
    current_month_total: Decimal
    previous_month_total: Decimal
    percentage_change: float
    absolute_difference: Decimal


class AnalyticsDashboardResponse(BaseModel):
    period: str
    summary: SpendingSummary
    categories: List[CategoryBreakdown]
    trends: List[SpendingTrendPoint]
    day_of_week: List[DayOfWeekPoint]
    top_merchants: List[TopMerchantPoint]
    comparison: Optional[MonthlyComparison] = None
