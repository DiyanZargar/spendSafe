import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.recurring_expense import RecurringExpense
from app.models.expense import Expense
from app.repositories.recurring_expense_repository import RecurringExpenseRepository
from app.repositories.expense_repository import ExpenseRepository
from app.services.base_service import BaseService
from app.utils.currency import round_decimal
from app.utils.datetime import utc_now


class RecurringExpenseService(BaseService[RecurringExpense]):
    """Service handling recurring expense rules, subscription detection, and automated execution."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.recurring_repo = RecurringExpenseRepository(session)
        self.expense_repo = ExpenseRepository(session)
        super().__init__(self.recurring_repo)

    async def create_recurring(
        self,
        user_id: uuid.UUID,
        merchant: str,
        amount: Decimal,
        currency: str,
        category: str,
        frequency: str = "monthly",
        start_date: Optional[datetime] = None
    ) -> RecurringExpense:
        """Create a new recurring expense rule after explicit user confirmation."""
        now = utc_now()
        next_date = start_date or self._calculate_next_date(now, frequency)

        recurring = RecurringExpense(
            id=uuid.uuid4(),
            user_id=user_id,
            merchant=merchant.strip(),
            amount=round_decimal(amount),
            currency=currency.upper().strip(),
            category=category.strip().title(),
            frequency=frequency.lower().strip(),
            next_occurrence=next_date,
            status="active",
            created_at=now,
            updated_at=now,
        )
        return await self.recurring_repo.create(recurring)

    async def list_recurring(
        self,
        user_id: uuid.UUID,
        status: Optional[str] = None
    ) -> List[RecurringExpense]:
        """List recurring expenses for a user."""
        return await self.recurring_repo.list_by_user(user_id, status=status)

    async def detect_potential_recurring(
        self,
        user_id: uuid.UUID,
        merchant: str,
        amount: Decimal
    ) -> Optional[str]:
        """
        Check if an expense repeats past transactions.
        Returns a prompt for the user if a subscription pattern is suspected.
        """
        # Count past matching expenses for this merchant with similar amount
        query = select(func.count(Expense.id)).where(
            and_(
                Expense.user_id == user_id,
                func.lower(Expense.merchant) == merchant.lower().strip(),
                Expense.amount == round_decimal(amount),
            )
        )
        count = (await self.session.execute(query)).scalar_one() or 0

        # Also check if already tracked as a recurring expense
        existing_rec = select(RecurringExpense).where(
            and_(
                RecurringExpense.user_id == user_id,
                func.lower(RecurringExpense.merchant) == merchant.lower().strip(),
                RecurringExpense.status == "active"
            )
        )
        has_recurring = (await self.session.execute(existing_rec)).scalars().first()

        if count >= 2 and not has_recurring:
            return (
                f"I noticed you have paid {merchant} {amount} multiple times. "
                f"Would you like me to track this as a recurring monthly subscription?"
            )
        return None

    async def process_due_expenses(self) -> int:
        """Process all due recurring expenses across the platform (called by background worker)."""
        now = utc_now()
        due_items = await self.recurring_repo.get_due_expenses(up_to_date=now)
        processed_count = 0

        for item in due_items:
            # 1. Create the materialized expense record
            expense = Expense(
                id=uuid.uuid4(),
                user_id=item.user_id,
                amount=item.amount,
                currency=item.currency,
                category=item.category,
                merchant=item.merchant,
                description=f"Automated recurring payment ({item.frequency})",
                occurred_at=item.next_occurrence,
                source="recurring",
                created_at=now,
                updated_at=now,
            )
            self.session.add(expense)

            # 2. Advance next_occurrence
            item.last_processed_at = now
            item.next_occurrence = self._calculate_next_date(item.next_occurrence, item.frequency)
            item.updated_at = now
            processed_count += 1

        await self.session.flush()
        return processed_count

    def _calculate_next_date(self, current: datetime, frequency: str) -> datetime:
        """Advance datetime based on frequency."""
        freq = frequency.lower().strip()
        if freq == "daily":
            return current + timedelta(days=1)
        elif freq == "weekly":
            return current + timedelta(weeks=1)
        elif freq == "yearly":
            return current.replace(year=current.year + 1)
        else:
            # Default monthly: advance by approx 30 days or next month
            import calendar
            month = current.month + 1
            year = current.year
            if month > 12:
                month = 1
                year += 1
            max_day = calendar.monthrange(year, month)[1]
            day = min(current.day, max_day)
            return current.replace(year=year, month=month, day=day)
