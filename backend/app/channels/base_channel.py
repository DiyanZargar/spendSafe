from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Union
from pydantic import BaseModel


class ParsedIncomingMessage(BaseModel):
    sender_id: str
    text: str
    metadata: Optional[Dict[str, Any]] = None


class BaseChannel(ABC):
    """Abstract interface that all external communication channels must implement."""

    @abstractmethod
    async def send_message(
        self,
        recipient_id: str,
        message: str,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send a text message to the recipient over this channel."""
        pass

    @abstractmethod
    async def send_image(
        self,
        recipient_id: str,
        image_data: Union[bytes, str],
        caption: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send an image (raw bytes or public URL) with optional caption."""
        pass

    @abstractmethod
    async def parse_incoming(self, payload: Dict[str, Any]) -> ParsedIncomingMessage:
        """Normalize raw incoming webhook payload into a ParsedIncomingMessage."""
        pass

    @abstractmethod
    async def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        """Validate credentials with the channel provider API."""
        pass

    @abstractmethod
    async def connect(self, credentials: Dict[str, Any]) -> bool:
        """Establish or verify webhook / connection with provider."""
        pass

    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect or tear down channel connection."""
        pass
