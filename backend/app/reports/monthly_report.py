import uuid
from decimal import Decimal
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.reports.base_report import BaseReport
from app.reports.renderer import render_financial_report
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.recurring_expense_repository import RecurringExpenseRepository
from app.utils.datetime import get_period_range, parse_month_string
from app.utils.currency import round_decimal


class MonthlyReport(BaseReport):
    """Generates monthly financial breakdown and visual infographic."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.expense_repo = ExpenseRepository(session)
        self.user_repo = UserRepository(session)
        self.recurring_repo = RecurringExpenseRepository(session)

    async def generate(self, user_id: uuid.UUID, period: str) -> Dict[str, Any]:
        """Aggregate monthly statistics, trends, and comparisons."""
        user = await self.user_repo.get(user_id)
        currency = user.currency if user else "USD"

        # Determine start and end date
        period_norm = period.lower().replace("-", "_").strip()
        if period_norm in ("this_month", "previous_month", "today", "this_week", "this_year"):
            start_date, end_date = get_period_range(period_norm)
            period_label = period_norm.replace("_", " ").title()
        else:
            start_date, end_date = parse_month_string(period)
            period_label = start_date.strftime("%B %Y")

        # 1. Summary
        summary = await self.expense_repo.get_summary(user_id, start_date, end_date)
        total_amount = summary["total_amount"]
        days_in_period = max(1, (end_date - start_date).days + 1)
        avg_daily = round_decimal(total_amount / Decimal(days_in_period))

        # 2. Categories
        categories = await self.expense_repo.get_category_breakdown(user_id, start_date, end_date)

        # 3. Daily trends
        trends = await self.expense_repo.get_daily_breakdown(user_id, start_date, end_date)

        # 4. Top Merchants
        top_merchants = await self.expense_repo.get_top_merchants(user_id, start_date, end_date, limit=5)

        # 5. Recurring expenses
        recurring = await self.recurring_repo.list_by_user(user_id, status="active")

        # 6. Largest individual expenses
        largest_expenses, _ = await self.expense_repo.list_by_user(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            limit=5
        )

        data = {
            "period": period_label,
            "period_raw": period,
            "currency": currency,
            "summary": {
                "total_amount": float(total_amount),
                "transaction_count": summary["transaction_count"],
                "average_amount": float(summary["average_amount"]),
                "average_daily": float(avg_daily),
            },
            "categories": [
                {
                    "category": c["category"],
                    "amount": float(c["amount"]),
                    "percentage": c["percentage"],
                    "count": c["count"],
                }
                for c in categories
            ],
            "trends": [
                {
                    "date": t["date"],
                    "amount": float(t["amount"]),
                    "count": t["count"],
                }
                for t in trends
            ],
            "top_merchants": [
                {
                    "merchant": m["merchant"],
                    "amount": float(m["amount"]),
                    "count": m["count"],
                }
                for m in top_merchants
            ],
            "recurring_count": len(recurring),
            "largest_expenses": [
                {
                    "id": str(e.id),
                    "merchant": e.merchant or "Unspecified",
                    "amount": float(e.amount),
                    "category": e.category,
                    "date": e.occurred_at.strftime("%Y-%m-%d"),
                }
                for e in largest_expenses
            ],
        }
        return data

    async def render(self, data: Dict[str, Any]) -> bytes:
        """Render the data into a PNG infographic card."""
        return render_financial_report(data)
