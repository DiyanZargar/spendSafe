import uuid
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.reports.base_report import BaseReport
from app.reports.monthly_report import MonthlyReport


class YearlyReport(BaseReport):
    """Generates annual financial breakdown and visual report."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.monthly_report = MonthlyReport(session)

    async def generate(self, user_id: uuid.UUID, period: str = "this_year") -> Dict[str, Any]:
        """Aggregate yearly statistics."""
        data = await self.monthly_report.generate(user_id=user_id, period="this_year")
        data["period"] = f"Annual Financial Report ({period.replace('_', ' ').title()})"
        return data

    async def render(self, data: Dict[str, Any]) -> bytes:
        """Render yearly report to PNG image."""
        return await self.monthly_report.render(data)
