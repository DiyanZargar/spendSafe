import uuid
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.services.report_service import ReportService
from app.security.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Financial Reports"])


def get_report_service(db: AsyncSession = Depends(get_db)) -> ReportService:
    return ReportService(db)


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    data: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(get_report_service)
) -> ReportResponse:
    """Generate financial report and create visual PNG infographic card."""
    report = await service.generate_report(
        user_id=current_user.id,
        period=data.period,
        report_type=data.report_type
    )
    return ReportResponse.model_validate(report)


@router.get("/{id}", response_model=ReportResponse)
async def get_report(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(get_report_service)
) -> ReportResponse:
    """Get report metadata and structured dataset."""
    report = await service.get_user_report(id, current_user.id)
    return ReportResponse.model_validate(report)


@router.get("/download/{id}")
async def download_report_image(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(get_report_service)
) -> Response:
    """Download the high-resolution visual PNG financial report."""
    report = await service.get_user_report(id, current_user.id)
    image_bytes = await service.get_report_image(id, current_user.id)

    filename = f"financial_report_{report.period.replace(' ', '_')}.png"
    return Response(
        content=image_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
