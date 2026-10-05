from typing import List, Any
from app.agents.tools.base_tool import BaseTool


class ReportTools(BaseTool):
    """Tool suite for triggering and delivering financial reports."""

    def get_tool_callables(self) -> List[Any]:
        return [
            self.generate_monthly_report,
            self.generate_yearly_report,
        ]

    async def generate_monthly_report(self, period: str = "this_month") -> str:
        """
        Generate a comprehensive monthly financial report with charts.
        Args:
            period: Month to generate (e.g. 'this_month', 'previous_month', 'September', '2026-09').
        """
        report_service = self.services["report_service"]
        report = await report_service.generate_report(
            user_id=self.context.user_id,
            period=period,
            report_type="monthly"
        )
        total = report.data.get("summary", {}).get("total_amount", 0)
        curr = report.data.get("currency", "USD")
        count = report.data.get("summary", {}).get("transaction_count", 0)
        label = report.data.get("period", period)

        return (
            f"📄 Generated {label} Report:\n"
            f"• Total Spending: {curr} {total:,.2f}\n"
            f"• Transactions: {count}\n"
            f"• Visual Report PNG generated and available for download. [Report ID: {str(report.id)[:8]}]"
        )

    async def generate_yearly_report(self, period: str = "this_year") -> str:
        """
        Generate an annual financial summary report.
        Args:
            period: Year to generate (e.g. 'this_year', '2026').
        """
        report_service = self.services["report_service"]
        report = await report_service.generate_report(
            user_id=self.context.user_id,
            period=period,
            report_type="yearly"
        )
        total = report.data.get("summary", {}).get("total_amount", 0)
        curr = report.data.get("currency", "USD")
        return f"📄 Annual Report ({period}) generated with total spending of {curr} {total:,.2f}. [Report ID: {str(report.id)[:8]}]"
