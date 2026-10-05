from typing import Optional, List, Any
from app.agents.tools.base_tool import BaseTool
from app.utils.currency import format_currency


class AnalyticsTools(BaseTool):
    """Tool suite for answering financial queries and computing aggregates."""

    def get_tool_callables(self) -> List[Any]:
        return [
            self.get_daily_summary,
            self.get_monthly_summary,
            self.get_yearly_summary,
            self.get_category_breakdown,
            self.compare_periods,
        ]

    async def get_daily_summary(self) -> str:
        """Get summary of expenses recorded today."""
        analytics_service = self.services["analytics_service"]
        data = await analytics_service.get_dashboard_analytics(self.context.user_id, period="today")
        spent = format_currency(data.summary.total_amount, data.summary.currency)
        count = data.summary.transaction_count

        if count == 0:
            return "You haven't recorded any expenses today."

        top_cat = f", top category: {data.categories[0].category}" if data.categories else ""
        return f"📅 Today you have spent {spent} across {count} transaction(s){top_cat}."

    async def get_monthly_summary(self, month: Optional[str] = None) -> str:
        """
        Get spending summary for the current or specified month.
        Args:
            month: 'this_month', 'previous_month', or a month name like 'September'.
        """
        analytics_service = self.services["analytics_service"]
        period = month or "this_month"
        data = await analytics_service.get_dashboard_analytics(self.context.user_id, period=period)

        spent = format_currency(data.summary.total_amount, data.summary.currency)
        avg = format_currency(data.summary.average_amount, data.summary.currency)
        count = data.summary.transaction_count

        msg = [f"📊 Spending Summary for {period.replace('_', ' ').title()}:"]
        msg.append(f"• Total Spent: {spent}")
        msg.append(f"• Total Transactions: {count}")
        msg.append(f"• Average Per Transaction: {avg}")

        if data.comparison:
            prev_spent = format_currency(data.comparison.previous_month_total, data.summary.currency)
            change_sign = "+" if data.comparison.percentage_change > 0 else ""
            msg.append(f"• Previous Month: {prev_spent} ({change_sign}{data.comparison.percentage_change:.1f}%)")

        return "\n".join(msg)

    async def get_yearly_summary(self, year: Optional[str] = None) -> str:
        """Get spending totals for the current or specified year."""
        analytics_service = self.services["analytics_service"]
        data = await analytics_service.get_dashboard_analytics(self.context.user_id, period="this_year")
        spent = format_currency(data.summary.total_amount, data.summary.currency)
        count = data.summary.transaction_count
        return f"📅 This year you have spent {spent} across {count} transaction(s)."

    async def get_category_breakdown(self, period: str = "this_month") -> str:
        """
        Get spending breakdown across categories.
        Args:
            period: Timeframe such as 'this_month', 'this_week', 'this_year'.
        """
        analytics_service = self.services["analytics_service"]
        data = await analytics_service.get_dashboard_analytics(self.context.user_id, period=period)
        if not data.categories:
            return f"No category spending recorded for {period}."

        lines = [f"🏷️ Category Breakdown for {period.replace('_', ' ').title()}:"]
        for c in data.categories:
            amt = format_currency(c.amount, data.summary.currency)
            lines.append(f"• {c.category}: {amt} ({c.percentage:.1f}%)")
        return "\n".join(lines)

    async def compare_periods(self) -> str:
        """Compare this month's spending with the previous month."""
        analytics_service = self.services["analytics_service"]
        data = await analytics_service.get_dashboard_analytics(self.context.user_id, period="this_month")
        if not data.comparison:
            return "Insufficient past data to compare periods."

        curr = format_currency(data.comparison.current_month_total, data.summary.currency)
        prev = format_currency(data.comparison.previous_month_total, data.summary.currency)
        pct = data.comparison.percentage_change
        trend = "more" if pct > 0 else "less"

        return (
            f"📈 Monthly Comparison:\n"
            f"• This Month: {curr}\n"
            f"• Last Month: {prev}\n"
            f"• You have spent {abs(pct):.1f}% {trend} compared to last month."
        )
