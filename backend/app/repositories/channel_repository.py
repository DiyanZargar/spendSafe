import uuid
from typing import Optional, List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.channel_connection import ChannelConnection
from app.repositories.base_repository import BaseRepository


class ChannelRepository(BaseRepository[ChannelConnection]):
    """Repository for ChannelConnection entity operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(ChannelConnection, session)

    async def get_by_external_id(
        self,
        channel_type: str,
        external_identifier: str
    ) -> Optional[ChannelConnection]:
        """Look up connection by channel type and external identifier (e.g. phone number)."""
        clean_channel = channel_type.strip().lower()
        clean_identifier = external_identifier.strip()

        query = select(ChannelConnection).where(
            and_(
                ChannelConnection.channel_type == clean_channel,
                ChannelConnection.external_identifier == clean_identifier,
                ChannelConnection.is_active == True
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_user_connection(
        self,
        user_id: uuid.UUID,
        channel_type: str
    ) -> Optional[ChannelConnection]:
        """Retrieve connection of a specific type for a user."""
        query = select(ChannelConnection).where(
            and_(
                ChannelConnection.user_id == user_id,
                ChannelConnection.channel_type == channel_type.strip().lower()
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def list_by_user(self, user_id: uuid.UUID) -> List[ChannelConnection]:
        """List all channel connections belonging to a user."""
        query = (
            select(ChannelConnection)
            .where(ChannelConnection.user_id == user_id)
            .order_by(ChannelConnection.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
