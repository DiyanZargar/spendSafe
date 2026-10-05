import uuid
from decimal import Decimal
from typing import Tuple, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.expense import Expense
from app.models.category import Category
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseFilter
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.category_repository import CategoryRepository
from app.services.base_service import BaseService
from app.utils.currency import round_decimal
from app.utils.datetime import utc_now, to_utc


class ExpenseService(BaseService[Expense]):
    """Domain service managing user-isolated expense operations and category resolution."""

    def __init__(self, session: AsyncSession):
        self.expense_repo = ExpenseRepository(session)
        self.category_repo = CategoryRepository(session)
        super().__init__(self.expense_repo)

    async def create_expense(self, user_id: uuid.UUID, data: ExpenseCreate) -> Expense:
        """Create a new expense for the authenticated user."""
        # Resolve or match category
        category_entity = await self.category_repo.get_by_name(user_id, data.category)
        category_name = category_entity.name if category_entity else data.category.strip().title()
        category_id = category_entity.id if category_entity else None

        # Clean merchant
        clean_merchant = data.merchant.strip() if data.merchant else None

        new_expense = Expense(
            id=uuid.uuid4(),
            user_id=user_id,
            amount=round_decimal(data.amount),
            currency=data.currency.upper().strip(),
            category_id=category_id,
            category=category_name,
            merchant=clean_merchant,
            description=data.description.strip() if data.description else None,
            occurred_at=to_utc(data.occurred_at),
            source=data.source.lower().strip(),
            created_at=utc_now(),
            updated_at=utc_now(),
        )

        return await self.expense_repo.create(new_expense)

    async def get_expense(self, id: uuid.UUID, user_id: uuid.UUID) -> Expense:
        """Retrieve an expense ensuring user isolation."""
        expense = await self.expense_repo.get_by_user(id=id, user_id=user_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found or does not belong to you."
            )
        return expense

    async def list_expenses(
        self,
        user_id: uuid.UUID,
        filter_in: ExpenseFilter
    ) -> Tuple[List[Expense], int]:
        """List expenses matching filters for the authenticated user."""
        start_utc = to_utc(filter_in.start_date) if filter_in.start_date else None
        end_utc = to_utc(filter_in.end_date) if filter_in.end_date else None

        return await self.expense_repo.list_by_user(
            user_id=user_id,
            start_date=start_utc,
            end_date=end_utc,
            category=filter_in.category,
            merchant=filter_in.merchant,
            limit=filter_in.limit,
            offset=filter_in.offset,
        )

    async def update_expense(
        self,
        id: uuid.UUID,
        user_id: uuid.UUID,
        data: ExpenseUpdate
    ) -> Expense:
        """Update an existing expense with user isolation check."""
        expense = await self.get_expense(id, user_id)

        if data.amount is not None:
            expense.amount = round_decimal(data.amount)
        if data.currency is not None:
            expense.currency = data.currency.upper().strip()
        if data.category is not None:
            cat_entity = await self.category_repo.get_by_name(user_id, data.category)
            expense.category = cat_entity.name if cat_entity else data.category.strip().title()
            expense.category_id = cat_entity.id if cat_entity else None
        if data.merchant is not None:
            expense.merchant = data.merchant.strip() if data.merchant else None
        if data.description is not None:
            expense.description = data.description.strip() if data.description else None
        if data.occurred_at is not None:
            expense.occurred_at = to_utc(data.occurred_at)

        expense.updated_at = utc_now()
        return await self.expense_repo.update(expense)

    async def delete_expense(self, id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete an expense belonging to the user."""
        expense = await self.get_expense(id, user_id)
        await self.expense_repo.delete(expense.id)
        return True

    async def list_categories(self, user_id: uuid.UUID) -> List[Category]:
        """Fetch categories available to the user."""
        return await self.category_repo.list_for_user(user_id)
