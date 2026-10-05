from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.expense import Expense
from app.repositories.base_repository import BaseRepository
from app.utils.currency import round_decimal


class ExpenseRepository(BaseRepository[Expense]):
    """Repository for user-scoped Expense database interactions."""

    def __init__(self, session: AsyncSession):
        super().__init__(Expense, session)

    async def get_by_user(self, id: UUID, user_id: UUID) -> Optional[Expense]:
        """Fetch a specific expense enforcing strict user isolation."""
        query = select(Expense).where(
            and_(Expense.id == id, Expense.user_id == user_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        category: Optional[str] = None,
        merchant: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Expense], int]:
        """Retrieve paginated expenses for a user with optional filters."""
        filters = [Expense.user_id == user_id]

        if start_date:
            filters.append(Expense.occurred_at >= start_date)
        if end_date:
            filters.append(Expense.occurred_at <= end_date)
        if category:
            filters.append(func.lower(Expense.category) == category.lower().strip())
        if merchant:
            filters.append(func.lower(Expense.merchant).contains(merchant.lower().strip()))

        # Count total matching
        count_query = select(func.count(Expense.id)).where(and_(*filters))
        total_count = (await self.session.execute(count_query)).scalar_one() or 0

        # Fetch records
        query = (
            select(Expense)
            .where(and_(*filters))
            .order_by(desc(Expense.occurred_at), desc(Expense.created_at))
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all()), total_count

    async def get_summary(
        self,
        user_id: UUID,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Aggregate total spending, transaction count, and average for a period."""
        query = select(
            func.coalesce(func.sum(Expense.amount), 0),
            func.count(Expense.id)
        ).where(
            and_(
                Expense.user_id == user_id,
                Expense.occurred_at >= start_date,
                Expense.occurred_at <= end_date,
            )
        )
        result = await self.session.execute(query)
        total_sum, count = result.one()
        total_amount = round_decimal(total_sum)
        avg_amount = round_decimal(total_amount / Decimal(count) if count > 0 else Decimal("0.00"))

        return {
            "total_amount": total_amount,
            "transaction_count": count,
            "average_amount": avg_amount,
        }

    async def get_category_breakdown(
        self,
        user_id: UUID,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Calculate spend breakdown by category with percentages."""
        # First get total amount for percentage calculation
        summary = await self.get_summary(user_id, start_date, end_date)
        total_spent = summary["total_amount"]

        query = (
            select(
                Expense.category,
                func.sum(Expense.amount).label("category_total"),
                func.count(Expense.id).label("transaction_count")
            )
            .where(
                and_(
                    Expense.user_id == user_id,
                    Expense.occurred_at >= start_date,
                    Expense.occurred_at <= end_date,
                )
            )
            .group_by(Expense.category)
            .order_by(desc("category_total"))
        )
        result = await self.session.execute(query)
        rows = result.all()

        breakdown = []
        for cat, cat_sum, cnt in rows:
            amt = round_decimal(cat_sum)
            pct = round_decimal((amt / total_spent * Decimal("100")) if total_spent > 0 else Decimal("0.00"))
            breakdown.append({
                "category": cat,
                "amount": amt,
                "percentage": float(pct),
                "count": cnt,
            })
        return breakdown

    async def get_daily_breakdown(
        self,
        user_id: UUID,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Group spending by calendar date for trends."""
        query = (
            select(
                func.date(Expense.occurred_at).label("day"),
                func.sum(Expense.amount).label("daily_total"),
                func.count(Expense.id).label("daily_count")
            )
            .where(
                and_(
                    Expense.user_id == user_id,
                    Expense.occurred_at >= start_date,
                    Expense.occurred_at <= end_date,
                )
            )
            .group_by(func.date(Expense.occurred_at))
            .order_by(func.date(Expense.occurred_at))
        )
        result = await self.session.execute(query)
        rows = result.all()
        return [
            {
                "date": str(day),
                "amount": round_decimal(total),
                "count": count
            }
            for day, total, count in rows
        ]

    async def get_day_of_week_breakdown(
        self,
        user_id: UUID,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Group spending by day of the week (Monday-Sunday)."""
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        # Fetch expenses in range and aggregate in python to avoid SQLite vs Postgres dow dialect discrepancies
        query = select(Expense.amount, Expense.occurred_at).where(
            and_(
                Expense.user_id == user_id,
                Expense.occurred_at >= start_date,
                Expense.occurred_at <= end_date,
            )
        )
        result = await self.session.execute(query)
        data = {d: {"amount": Decimal("0.00"), "count": 0} for d in days}

        for amount, occurred_at in result.all():
            day_name = days[occurred_at.weekday()]
            data[day_name]["amount"] += Decimal(str(amount))
            data[day_name]["count"] += 1

        return [
            {
                "day": d,
                "amount": round_decimal(data[d]["amount"]),
                "count": data[d]["count"]
            }
            for d in days
        ]

    async def get_top_merchants(
        self,
        user_id: UUID,
        start_date: datetime,
        end_date: datetime,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Identify highest spend merchants."""
        query = (
            select(
                func.coalesce(Expense.merchant, "Unspecified").label("merchant_name"),
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("count")
            )
            .where(
                and_(
                    Expense.user_id == user_id,
                    Expense.occurred_at >= start_date,
                    Expense.occurred_at <= end_date,
                )
            )
            .group_by("merchant_name")
            .order_by(desc("total"))
            .limit(limit)
        )
        result = await self.session.execute(query)
        rows = result.all()
        return [
            {
                "merchant": name,
                "amount": round_decimal(tot),
                "count": cnt
            }
            for name, tot, cnt in rows
        ]

    async def search_expenses(
        self,
        user_id: UUID,
        query_text: str,
        limit: int = 10
    ) -> List[Expense]:
        """Perform text matching across merchant, description, and category."""
        term = f"%{query_text.lower().strip()}%"
        query = (
            select(Expense)
            .where(
                and_(
                    Expense.user_id == user_id,
                    (
                        func.lower(Expense.merchant).like(term) |
                        func.lower(Expense.description).like(term) |
                        func.lower(Expense.category).like(term)
                    )
                )
            )
            .order_by(desc(Expense.occurred_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
