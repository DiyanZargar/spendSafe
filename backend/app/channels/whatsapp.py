import httpx
from typing import Optional, Dict, Any, Union
from app.channels.base_channel import BaseChannel, ParsedIncomingMessage


class WhatsAppChannel(BaseChannel):
    """Adapter for Twilio WhatsApp messaging API."""

    async def send_message(
        self,
        recipient_id: str,
        message: str,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        creds = credentials or {}
        account_sid = creds.get("account_sid")
        auth_token = creds.get("auth_token")
        from_number = creds.get("whatsapp_number")

        if not account_sid or not auth_token or not from_number:
            return False

        # Format recipient with whatsapp: prefix if needed
        to_number = recipient_id if recipient_id.startswith("whatsapp:") else f"whatsapp:{recipient_id}"
        from_formatted = from_number if from_number.startswith("whatsapp:") else f"whatsapp:{from_number}"

        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        data = {
            "From": from_formatted,
            "To": to_number,
            "Body": message
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, data=data, auth=(account_sid, auth_token))
            return resp.status_code in (200, 201)

    async def send_image(
        self,
        recipient_id: str,
        image_data: Union[bytes, str],
        caption: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None
    ) -> bool:
        creds = credentials or {}
        account_sid = creds.get("account_sid")
        auth_token = creds.get("auth_token")
        from_number = creds.get("whatsapp_number")

        if not account_sid or not auth_token or not from_number:
            return False

        to_number = recipient_id if recipient_id.startswith("whatsapp:") else f"whatsapp:{recipient_id}"
        from_formatted = from_number if from_number.startswith("whatsapp:") else f"whatsapp:{from_number}"

        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        data = {
            "From": from_formatted,
            "To": to_number,
        }
        if caption:
            data["Body"] = caption

        # Twilio WhatsApp requires a publicly accessible MediaUrl for attachments
        if isinstance(image_data, str) and (image_data.startswith("http://") or image_data.startswith("https://")):
            data["MediaUrl"] = image_data

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, data=data, auth=(account_sid, auth_token))
            return resp.status_code in (200, 201)

    async def parse_incoming(self, payload: Dict[str, Any]) -> ParsedIncomingMessage:
        raw_from = str(payload.get("From", ""))
        sender_id = raw_from.replace("whatsapp:", "").strip()
        body = str(payload.get("Body", ""))
        return ParsedIncomingMessage(
            sender_id=sender_id,
            text=body,
            metadata=payload
        )

    async def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        account_sid = credentials.get("account_sid")
        auth_token = credentials.get("auth_token")
        if not account_sid or not auth_token:
            return False
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}.json"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, auth=(account_sid, auth_token))
                return resp.status_code == 200
        except Exception:
            return False

    async def connect(self, credentials: Dict[str, Any]) -> bool:
        return await self.validate_credentials(credentials)

    async def disconnect(self) -> bool:
        return True
