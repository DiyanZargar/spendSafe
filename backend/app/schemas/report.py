import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ReportGenerateRequest(BaseModel):
    period: str = Field(default="this_month", description="today, this_month, previous_month, 2026-09, etc.")
    report_type: str = Field(default="monthly", description="monthly or yearly")


class ReportResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    report_type: str
    period: str
    data: Dict[str, Any]
    file_path: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
