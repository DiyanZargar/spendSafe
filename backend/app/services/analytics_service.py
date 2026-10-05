import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.user_repository import UserRepository
from app.schemas.analytics import (
    AnalyticsDashboardResponse, SpendingSummary, CategoryBreakdown,
    SpendingTrendPoint, DayOfWeekPoint, TopMerchantPoint, MonthlyComparison
)
from app.utils.datetime import get_period_range
from app.utils.currency import round_decimal


class AnalyticsService:
    """Service calculating financial KPIs, aggregations, and trends."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.expense_repo = ExpenseRepository(session)
        self.user_repo = UserRepository(session)

    async def get_dashboard_analytics(
        self,
        user_id: uuid.UUID,
        period: str = "this_month",
        custom_start: Optional[datetime] = None,
        custom_end: Optional[datetime] = None,
    ) -> AnalyticsDashboardResponse:
        """Calculate complete financial dashboard metrics for a user and time frame."""
        user = await self.user_repo.get(user_id)
        currency = user.currency if user else "USD"

        start_date, end_date = get_period_range(period, custom_start, custom_end)

        # 1. Summary KPIs
        summary_raw = await self.expense_repo.get_summary(user_id, start_date, end_date)
        summary = SpendingSummary(
            total_amount=summary_raw["total_amount"],
            transaction_count=summary_raw["transaction_count"],
            average_amount=summary_raw["average_amount"],
            currency=currency,
        )

        # 2. Category Breakdown
        categories_raw = await self.expense_repo.get_category_breakdown(user_id, start_date, end_date)
        categories = [
            CategoryBreakdown(
                category=item["category"],
                amount=item["amount"],
                percentage=item["percentage"],
                count=item["count"],
            )
            for item in categories_raw
        ]

        # 3. Trends (daily)
        trends_raw = await self.expense_repo.get_daily_breakdown(user_id, start_date, end_date)
        trends = [
            SpendingTrendPoint(
                date=item["date"],
                amount=item["amount"],
                count=item["count"],
            )
            for item in trends_raw
        ]

        # 4. Day of Week
        dow_raw = await self.expense_repo.get_day_of_week_breakdown(user_id, start_date, end_date)
        dow = [
            DayOfWeekPoint(
                day=item["day"],
                amount=item["amount"],
                count=item["count"],
            )
            for item in dow_raw
        ]

        # 5. Top Merchants
        merchants_raw = await self.expense_repo.get_top_merchants(user_id, start_date, end_date, limit=5)
        top_merchants = [
            TopMerchantPoint(
                merchant=item["merchant"],
                amount=item["amount"],
                count=item["count"],
            )
            for item in merchants_raw
        ]

        # 6. Monthly Comparison (if looking at this_month)
        comparison = None
        if period.lower().replace("-", "_").strip() == "this_month":
            prev_start, prev_end = get_period_range("previous_month")
            prev_summary = await self.expense_repo.get_summary(user_id, prev_start, prev_end)
            prev_total = prev_summary["total_amount"]
            curr_total = summary.total_amount

            diff = curr_total - prev_total
            if prev_total > Decimal("0.00"):
                pct_change = float(round_decimal((diff / prev_total) * Decimal("100")))
            else:
                pct_change = 100.0 if curr_total > Decimal("0.00") else 0.0

            comparison = MonthlyComparison(
                current_month_total=curr_total,
                previous_month_total=prev_total,
                percentage_change=pct_change,
                absolute_difference=diff,
            )

        return AnalyticsDashboardResponse(
            period=period,
            summary=summary,
            categories=categories,
            trends=trends,
            day_of_week=dow,
            top_merchants=top_merchants,
            comparison=comparison,
        )
