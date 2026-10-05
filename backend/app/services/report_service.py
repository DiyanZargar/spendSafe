import os
import uuid
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.report import Report
from app.repositories.base_repository import BaseRepository
from app.reports.monthly_report import MonthlyReport
from app.reports.yearly_report import YearlyReport
from app.services.base_service import BaseService
from app.utils.datetime import utc_now

REPORTS_DIR = "reports_output"


class ReportService(BaseService[Report]):
    """Service orchestrating financial report generation, rendering, and caching."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.report_repo = BaseRepository(Report, session)
        self.monthly_reporter = MonthlyReport(session)
        self.yearly_reporter = YearlyReport(session)
        super().__init__(self.report_repo)

    async def generate_report(
        self,
        user_id: uuid.UUID,
        period: str = "this_month",
        report_type: str = "monthly"
    ) -> Report:
        """Generate financial data, render visual PNG infographic, and persist report record."""
        # 1. Compile Data
        if report_type.lower().strip() == "yearly":
            reporter = self.yearly_reporter
        else:
            reporter = self.monthly_reporter

        report_data = await reporter.generate(user_id=user_id, period=period)

        # 2. Render Visual Image
        image_bytes = await reporter.render(report_data)

        # 3. Store file locally
        os.makedirs(REPORTS_DIR, exist_ok=True)
        filename = f"report_{user_id}_{period}_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(REPORTS_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(image_bytes)

        # 4. Save Record
        report_entity = Report(
            id=uuid.uuid4(),
            user_id=user_id,
            report_type=report_type.lower().strip(),
            period=period.strip(),
            data=report_data,
            file_path=filepath,
            status="generated",
            created_at=utc_now(),
        )
        return await self.report_repo.create(report_entity)

    async def get_user_report(self, report_id: uuid.UUID, user_id: uuid.UUID) -> Report:
        """Fetch report with user isolation enforcement."""
        report = await self.report_repo.get(report_id)
        if not report or report.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found or does not belong to you."
            )
        return report

    async def get_report_image(self, report_id: uuid.UUID, user_id: uuid.UUID) -> bytes:
        """Retrieve rendered PNG bytes for a report."""
        report = await self.get_user_report(report_id, user_id)
        if report.file_path and os.path.exists(report.file_path):
            with open(report.file_path, "rb") as f:
                return f.read()

        # Re-render if file was cleaned up
        reporter = self.yearly_reporter if report.report_type == "yearly" else self.monthly_reporter
        return await reporter.render(report.data)
