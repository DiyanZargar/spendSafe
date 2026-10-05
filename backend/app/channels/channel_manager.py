import uuid
from typing import Dict, Any, Optional, Union
from sqlalchemy.ext.asyncio import AsyncSession
from app.channels.base_channel import BaseChannel, ParsedIncomingMessage
from app.channels.web import WebChannel
from app.channels.telegram import TelegramChannel
from app.channels.whatsapp import WhatsAppChannel
from app.channels.slack import SlackChannel
from app.repositories.channel_repository import ChannelRepository
from app.security.encryption import decrypt_credentials


class ChannelManager:
    """Orchestrates channel adapters, credential decryption, and outgoing dispatching."""

    def __init__(self, session: Optional[AsyncSession] = None):
        self.session = session
        self._channels: Dict[str, BaseChannel] = {
            "web": WebChannel(),
            "telegram": TelegramChannel(),
            "whatsapp": WhatsAppChannel(),
            "slack": SlackChannel(),
        }

    def get_channel(self, channel_type: str) -> BaseChannel:
        """Retrieve registered channel adapter by name."""
        channel_key = channel_type.lower().strip()
        channel = self._channels.get(channel_key)
        if not channel:
            raise ValueError(f"Unsupported channel type: '{channel_type}'")
        return channel

    async def get_credentials_for_user(
        self,
        user_id: Optional[uuid.UUID],
        channel_type: str,
        recipient_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fetch and decrypt credentials for a user's channel connection."""
        if not self.session:
            return {}
        repo = ChannelRepository(self.session)
        conn = None
        if user_id:
            conn = await repo.get_user_connection(user_id, channel_type)
        elif recipient_id:
            conn = await repo.get_by_external_id(channel_type, recipient_id)
        if conn and conn.credentials_encrypted:
            return decrypt_credentials(conn.credentials_encrypted)
        return {}

    async def send_message(
        self,
        user_id: Optional[uuid.UUID],
        channel_type: str,
        recipient_id: str,
        message: str
    ) -> bool:
        """Dispatch a message through the appropriate channel with user credentials."""
        channel = self.get_channel(channel_type)
        credentials = await self.get_credentials_for_user(user_id, channel_type, recipient_id=recipient_id)
        return await channel.send_message(recipient_id, message, credentials)

    async def send_image(
        self,
        user_id: uuid.UUID,
        channel_type: str,
        recipient_id: str,
        image_data: Union[bytes, str],
        caption: Optional[str] = None
    ) -> bool:
        """Dispatch an image through the appropriate channel with user credentials."""
        channel = self.get_channel(channel_type)
        credentials = await self.get_credentials_for_user(user_id, channel_type)
        return await channel.send_image(recipient_id, image_data, caption, credentials)

    async def parse_incoming(
        self,
        channel_type: str,
        payload: Dict[str, Any]
    ) -> ParsedIncomingMessage:
        """Parse incoming webhook request according to the channel specification."""
        channel = self.get_channel(channel_type)
        return await channel.parse_incoming(payload)
