from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsDashboardResponse
from app.services.analytics_service import AnalyticsService
from app.security.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
async def get_dashboard(
    period: str = Query(default="this_month", description="today, this_week, this_month, previous_month, this_year, custom"),
    custom_start: Optional[datetime] = None,
    custom_end: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
) -> AnalyticsDashboardResponse:
    """Retrieve complete financial metrics and charts dataset for dashboard."""
    return await service.get_dashboard_analytics(
        user_id=current_user.id,
        period=period,
        custom_start=custom_start,
        custom_end=custom_end
    )
