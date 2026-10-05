import uuid
from typing import Dict, Any
from arq.connections import RedisSettings
from app.config import settings
from app.database.database import async_session_maker
from app.workers.scheduler import get_scheduled_cron_jobs
from app.workers.daily_reminder import run_daily_reminder_job
from app.workers.recurring_expenses import run_recurring_expenses_job
from app.services.report_service import ReportService
from app.channels.channel_manager import ChannelManager


async def async_generate_report_job(ctx: Dict[str, Any], user_id_str: str, period: str) -> str:
    """Async background task for rendering heavy financial reports."""
    user_id = uuid.UUID(user_id_str)
    async with async_session_maker() as session:
        service = ReportService(session)
        report = await service.generate_report(user_id=user_id, period=period)
        await session.commit()
        return str(report.id)


async def send_notification_job(
    ctx: Dict[str, Any],
    user_id_str: str,
    channel_type: str,
    recipient_id: str,
    message: str
) -> bool:
    """Async background task for dispatching notifications."""
    user_id = uuid.UUID(user_id_str)
    async with async_session_maker() as session:
        mgr = ChannelManager(session)
        return await mgr.send_message(user_id, channel_type, recipient_id, message)


class WorkerSettings:
    """ARQ Worker configuration class."""
    functions = [
        run_daily_reminder_job,
        run_recurring_expenses_job,
        async_generate_report_job,
        send_notification_job,
    ]
    cron_jobs = get_scheduled_cron_jobs()
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
