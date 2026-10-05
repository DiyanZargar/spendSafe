import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.models.user import User
from app.repositories.base_repository import BaseRepository
from app.services.base_service import BaseService
from app.utils.datetime import utc_now


class NotificationService(BaseService[Notification]):
    """Service handling notification scheduling and multi-channel dispatch."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.notification_repo = BaseRepository(Notification, session)
        super().__init__(self.notification_repo)

    async def schedule_notification(
        self,
        user_id: uuid.UUID,
        channel_type: str,
        title: str,
        message: str,
        scheduled_for: datetime,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """Create a scheduled notification record."""
        notification = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            channel_type=channel_type.lower().strip(),
            title=title.strip(),
            message=message.strip(),
            status="pending",
            scheduled_for=scheduled_for,
            notif_metadata=metadata,
            created_at=utc_now(),
        )
        return await self.notification_repo.create(notification)

    async def get_due_notifications(self, up_to_date: datetime) -> List[Notification]:
        """Query all pending notifications due for delivery."""
        query = (
            select(Notification)
            .where(
                and_(
                    Notification.status == "pending",
                    Notification.scheduled_for <= up_to_date
                )
            )
            .order_by(Notification.scheduled_for.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def mark_sent(self, notification_id: uuid.UUID) -> None:
        """Mark notification as delivered."""
        notification = await self.notification_repo.get(notification_id)
        if notification:
            notification.status = "sent"
            notification.sent_at = utc_now()
            await self.notification_repo.update(notification)

    async def mark_failed(self, notification_id: uuid.UUID, error_message: str) -> None:
        """Mark notification delivery failure."""
        notification = await self.notification_repo.get(notification_id)
        if notification:
            notification.status = "failed"
            current_meta = notification.notif_metadata or {}
            current_meta["error"] = error_message
            notification.notif_metadata = current_meta
            await self.notification_repo.update(notification)
