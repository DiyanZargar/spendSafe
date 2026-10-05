from app.database.database import async_session_maker
from app.services.recurring_expense_service import RecurringExpenseService


async def run_recurring_expenses_job(ctx=None) -> int:
    """
    Executes all recurring expenses that are due and advances next occurrence.
    """
    async with async_session_maker() as session:
        service = RecurringExpenseService(session)
        count = await service.process_due_expenses()
        await session.commit()
        return count
