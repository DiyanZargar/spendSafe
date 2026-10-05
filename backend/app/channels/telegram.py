import httpx
from typing import Optional, Dict, Any, Union
from app.channels.base_channel import BaseChannel, ParsedIncomingMessage


class TelegramChannel(BaseChannel):
    """Adapter for Telegram Bot API using httpx."""

    async def send_message(
        self,
        recipient_id: str,
        message: str,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        token = (credentials or {}).get("bot_token")
        if not token:
            return False

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": recipient_id,
            "text": message,
            "parse_mode": "Markdown"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            return resp.status_code == 200

    async def send_image(
        self,
        recipient_id: str,
        image_data: Union[bytes, str],
        caption: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        token = (credentials or {}).get("bot_token")
        if not token:
            return False

        url = f"https://api.telegram.org/bot{token}/sendPhoto"
        data = {"chat_id": recipient_id}
        if caption:
            data["caption"] = caption

        async with httpx.AsyncClient(timeout=20.0) as client:
            if isinstance(image_data, bytes):
                files = {"photo": ("report.png", image_data, "image/png")}
                resp = await client.post(url, data=data, files=files)
            else:
                data["photo"] = str(image_data)
                resp = await client.post(url, data=data)
            return resp.status_code == 200

    async def parse_incoming(self, payload: Dict[str, Any]) -> ParsedIncomingMessage:
        msg = payload.get("message", {})
        sender_id = str(msg.get("chat", {}).get("id") or msg.get("from", {}).get("id", ""))
        text = str(msg.get("text", ""))
        return ParsedIncomingMessage(
            sender_id=sender_id,
            text=text,
            metadata=payload
        )

    async def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        token = credentials.get("bot_token")
        if not token:
            return False
        url = f"https://api.telegram.org/bot{token}/getMe"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
                return resp.status_code == 200 and resp.json().get("ok") is True
        except Exception:
            return False

    async def connect(self, credentials: Dict[str, Any]) -> bool:
        return await self.validate_credentials(credentials)

    async def disconnect(self) -> bool:
        return True
