import httpx
from typing import Optional, Dict, Any, Union
from app.channels.base_channel import BaseChannel, ParsedIncomingMessage


class SlackChannel(BaseChannel):
    """Adapter skeleton for Slack Webhooks and Bot API."""

    async def send_message(
        self,
        recipient_id: str,
        message: str,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        creds = credentials or {}
        webhook_url = creds.get("webhook_url")
        bot_token = creds.get("bot_token")

        if webhook_url:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(webhook_url, json={"text": message})
                return resp.status_code == 200

        if bot_token:
            url = "https://slack.com/api/chat.postMessage"
            headers = {"Authorization": f"Bearer {bot_token}"}
            payload = {"channel": recipient_id, "text": message}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                return resp.status_code == 200 and resp.json().get("ok", False)

        return False

    async def send_image(
        self,
        recipient_id: str,
        image_data: Union[bytes, str],
        caption: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        text = caption or "Report attachment"
        return await self.send_message(recipient_id, text, credentials)

    async def parse_incoming(self, payload: Dict[str, Any]) -> ParsedIncomingMessage:
        event = payload.get("event", {})
        sender_id = str(event.get("user", payload.get("user_id", "")))
        text = str(event.get("text", payload.get("text", "")))
        return ParsedIncomingMessage(
            sender_id=sender_id,
            text=text,
            metadata=payload
        )

    async def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        if credentials.get("webhook_url"):
            return True
        bot_token = credentials.get("bot_token")
        if not bot_token:
            return False
        url = "https://slack.com/api/auth.test"
        headers = {"Authorization": f"Bearer {bot_token}"}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(url, headers=headers)
                return resp.status_code == 200 and resp.json().get("ok") is True
        except Exception:
            return False

    async def connect(self, credentials: Dict[str, Any]) -> bool:
        return await self.validate_credentials(credentials)

    async def disconnect(self) -> bool:
        return True
