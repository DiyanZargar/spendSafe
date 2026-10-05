import uuid
from decimal import Decimal
from typing import Optional, List, Any
from app.agents.tools.base_tool import BaseTool
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseFilter
from app.utils.currency import format_currency


class ExpenseTools(BaseTool):
    """Tool suite for expense tracking, retrieval, modification, and deletion."""

    def get_tool_callables(self) -> List[Any]:
        return [
            self.create_expense,
            self.list_expenses,
            self.get_expense,
            self.update_expense,
            self.delete_expense,
            self.search_and_delete_expense,
        ]

    async def create_expense(
        self,
        amount: float,
        category: str,
        merchant: Optional[str] = None,
        description: Optional[str] = None
    ) -> str:
        """
        Record and store a new expense.
        Args:
            amount: The monetary cost of the expense (e.g. 450.0).
            category: Expense category (e.g. 'Food & Dining', 'Transportation', 'Shopping').
            merchant: Store or vendor name (e.g. 'Uber', 'Starbucks', 'Netflix').
            description: Optional details about the purchase.
        """
        expense_service = self.services["expense_service"]
        expense_in = ExpenseCreate(
            amount=Decimal(str(amount)),
            currency=self.context.currency,
            category=category,
            merchant=merchant,
            description=description,
            source=self.context.channel,
        )
        created = await expense_service.create_expense(self.context.user_id, expense_in)
        formatted_amt = format_currency(created.amount, created.currency)
        vendor_str = f" at {created.merchant}" if created.merchant else ""

        # Check potential recurring
        recurring_service = self.services.get("recurring_service")
        recurring_prompt = ""
        if recurring_service and created.merchant:
            hint = await recurring_service.detect_potential_recurring(
                self.context.user_id, created.merchant, created.amount
            )
            if hint:
                recurring_prompt = f"\n\n💡 {hint}"

        return f"✅ Recorded expense of {formatted_amt} for {created.category}{vendor_str}.{recurring_prompt}"

    async def list_expenses(
        self,
        limit: int = 10,
        category: Optional[str] = None
    ) -> str:
        """
        List recent expenses for the user.
        Args:
            limit: Maximum number of transactions to retrieve.
            category: Optional category filter.
        """
        expense_service = self.services["expense_service"]
        filter_in = ExpenseFilter(limit=limit, category=category)
        expenses, total = await expense_service.list_expenses(self.context.user_id, filter_in)

        if not expenses:
            return "You have no recorded expenses yet."

        lines = [f"Found {len(expenses)} recent expense(s):"]
        for e in expenses:
            dt_str = e.occurred_at.strftime("%b %d")
            vendor = f" - {e.merchant}" if e.merchant else ""
            amt = format_currency(e.amount, e.currency)
            lines.append(f"• {dt_str}: {amt} ({e.category}{vendor}) [ID: {str(e.id)[:8]}]")
        return "\n".join(lines)

    async def get_expense(self, expense_id: str) -> str:
        """
        Retrieve details of a specific expense by ID.
        Args:
            expense_id: The UUID of the expense.
        """
        expense_service = self.services["expense_service"]
        try:
            uid = uuid.UUID(expense_id)
            exp = await expense_service.get_expense(uid, self.context.user_id)
            amt = format_currency(exp.amount, exp.currency)
            return (
                f"Expense Details:\n"
                f"• Amount: {amt}\n"
                f"• Category: {exp.category}\n"
                f"• Merchant: {exp.merchant or 'N/A'}\n"
                f"• Date: {exp.occurred_at.strftime('%Y-%m-%d %H:%M')}\n"
                f"• Source: {exp.source}"
            )
        except Exception as ex:
            return f"Could not find expense {expense_id}: {str(ex)}"

    async def update_expense(
        self,
        expense_id: str,
        amount: Optional[float] = None,
        category: Optional[str] = None,
        merchant: Optional[str] = None
    ) -> str:
        """
        Modify an existing expense.
        Args:
            expense_id: The UUID of the expense to update.
            amount: New amount.
            category: New category.
            merchant: New merchant name.
        """
        expense_service = self.services["expense_service"]
        try:
            uid = uuid.UUID(expense_id)
            data = ExpenseUpdate(
                amount=Decimal(str(amount)) if amount is not None else None,
                category=category,
                merchant=merchant
            )
            updated = await expense_service.update_expense(uid, self.context.user_id, data)
            amt = format_currency(updated.amount, updated.currency)
            return f"✅ Updated expense to {amt} for {updated.category} ({updated.merchant or 'N/A'})."
        except Exception as ex:
            return f"Failed to update expense: {str(ex)}"

    async def delete_expense(self, expense_id: str) -> str:
        """
        Delete an expense by UUID.
        Args:
            expense_id: The UUID of the expense to remove.
        """
        expense_service = self.services["expense_service"]
        try:
            uid = uuid.UUID(expense_id)
            await expense_service.delete_expense(uid, self.context.user_id)
            return f"✅ Deleted expense {expense_id}."
        except Exception as ex:
            return f"Failed to delete expense: {str(ex)}"

    async def search_and_delete_expense(self, query: str) -> str:
        """
        Find and delete an expense matching keywords (e.g. 'Uber', 'dinner', '800').
        Args:
            query: Keywords describing the transaction to delete.
        """
        repo = self.services["expense_service"].expense_repo
        matches = await repo.search_expenses(self.context.user_id, query, limit=3)
        if not matches:
            return f"No expenses found matching '{query}' to delete."
        if len(matches) > 1:
            candidates = [
                f"• {m.occurred_at.strftime('%b %d')}: {format_currency(m.amount, m.currency)} {m.merchant or m.category} [ID: {str(m.id)[:8]}]"
                for m in matches
            ]
            return f"Multiple matching expenses found. Please specify by ID:\n" + "\n".join(candidates)

        target = matches[0]
        await repo.delete(target.id)
        amt = format_currency(target.amount, target.currency)
        return f"✅ Deleted {amt} expense for {target.merchant or target.category} from {target.occurred_at.strftime('%b %d')}."
