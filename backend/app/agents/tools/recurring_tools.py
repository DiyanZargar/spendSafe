from decimal import Decimal
from typing import Optional, List, Any
from app.agents.tools.base_tool import BaseTool
from app.utils.currency import format_currency


class RecurringTools(BaseTool):
    """Tool suite for managing recurring expenses and subscriptions."""

    def get_tool_callables(self) -> List[Any]:
        return [
            self.detect_recurring_expenses,
            self.create_recurring_expense,
            self.list_recurring_expenses,
            self.check_subscription_status,
        ]

    async def detect_recurring_expenses(self, merchant: str, amount: float) -> str:
        """
        Check if an expense matches repeated payments and ask user if they want to track it.
        Args:
            merchant: Vendor name (e.g. Netflix, Spotify).
            amount: Payment amount.
        """
        service = self.services.get("recurring_service")
        if not service:
            return "Recurring service unavailable."
        prompt = await service.detect_potential_recurring(
            self.context.user_id, merchant, Decimal(str(amount))
        )
        return prompt or f"No repeated pattern detected for {merchant}."

    async def create_recurring_expense(
        self,
        merchant: str,
        amount: float,
        category: str = "Entertainment",
        frequency: str = "monthly"
    ) -> str:
        """
        Create a recurring expense subscription rule after user confirms.
        Args:
            merchant: Subscription name (e.g. Netflix).
            amount: Recurring cost.
            category: Category name.
            frequency: 'monthly', 'weekly', 'yearly', or 'daily'.
        """
        service = self.services["recurring_service"]
        rec = await service.create_recurring(
            user_id=self.context.user_id,
            merchant=merchant,
            amount=Decimal(str(amount)),
            currency=self.context.currency,
            category=category,
            frequency=frequency
        )
        amt = format_currency(rec.amount, rec.currency)
        next_date = rec.next_occurrence.strftime("%b %d, %Y")
        return f"✅ Created recurring rule for {rec.merchant} ({amt}/{rec.frequency}). Next charge: {next_date}."

    async def list_recurring_expenses(self) -> str:
        """List all active recurring expenses and subscriptions."""
        service = self.services["recurring_service"]
        items = await service.list_recurring(self.context.user_id, status="active")
        if not items:
            return "You have no active recurring subscriptions."

        lines = [f"Found {len(items)} active subscription(s):"]
        for it in items:
            amt = format_currency(it.amount, it.currency)
            next_date = it.next_occurrence.strftime("%b %d, %Y")
            lines.append(f"• {it.merchant}: {amt} ({it.frequency}) - Next: {next_date}")
        return "\n".join(lines)

    async def check_subscription_status(self, merchant: str) -> str:
        """
        Check if a particular subscription (e.g. 'Netflix') is currently active.
        Args:
            merchant: Name of the merchant/service.
        """
        service = self.services["recurring_service"]
        items = await service.list_recurring(self.context.user_id)
        for it in items:
            if it.merchant.lower().strip() == merchant.lower().strip():
                amt = format_currency(it.amount, it.currency)
                next_d = it.next_occurrence.strftime("%b %d, %Y")
                return f"Yes, your {it.merchant} subscription ({amt}/{it.frequency}) is {it.status.upper()}. Next renewal: {next_d}."
        return f"No subscription found for '{merchant}'."
