from typing import Optional, Dict, Any, Union
from app.channels.base_channel import BaseChannel, ParsedIncomingMessage


class WebChannel(BaseChannel):
    """Channel adapter for native React Web client interaction."""

    async def send_message(
        self,
        recipient_id: str,
        message: str,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        # In web channel, messages are delivered via REST / WebSocket responses directly
        return True

    async def send_image(
        self,
        recipient_id: str,
        image_data: Union[bytes, str],
        caption: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        return True

    async def parse_incoming(self, payload: Dict[str, Any]) -> ParsedIncomingMessage:
        return ParsedIncomingMessage(
            sender_id=str(payload.get("sender_id", "web-user")),
            text=str(payload.get("text", payload.get("message", ""))),
            metadata=payload.get("metadata", {})
        )

    async def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        return True

    async def connect(self, credentials: Dict[str, Any]) -> bool:
        return True

    async def disconnect(self) -> bool:
        return True
