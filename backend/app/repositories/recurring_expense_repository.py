import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.recurring_expense import RecurringExpense
from app.repositories.base_repository import BaseRepository


class RecurringExpenseRepository(BaseRepository[RecurringExpense]):
    """Repository for RecurringExpense persistence and scheduling."""

    def __init__(self, session: AsyncSession):
        super().__init__(RecurringExpense, session)

    async def get_by_user(self, id: uuid.UUID, user_id: uuid.UUID) -> Optional[RecurringExpense]:
        """Fetch recurring expense enforcing user isolation."""
        query = select(RecurringExpense).where(
            and_(RecurringExpense.id == id, RecurringExpense.user_id == user_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: uuid.UUID,
        status: Optional[str] = None
    ) -> List[RecurringExpense]:
        """List recurring expenses for a user, optionally filtered by status."""
        filters = [RecurringExpense.user_id == user_id]
        if status:
            filters.append(RecurringExpense.status == status.lower().strip())

        query = (
            select(RecurringExpense)
            .where(and_(*filters))
            .order_by(RecurringExpense.next_occurrence.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_due_expenses(self, up_to_date: datetime) -> List[RecurringExpense]:
        """Find all active recurring expenses due for execution."""
        query = (
            select(RecurringExpense)
            .where(
                and_(
                    RecurringExpense.status == "active",
                    RecurringExpense.next_occurrence <= up_to_date
                )
            )
            .order_by(RecurringExpense.next_occurrence.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
