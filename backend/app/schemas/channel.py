import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ChannelConnectionCreate(BaseModel):
    channel_type: str = Field(..., description="whatsapp, telegram, slack, web")
    external_identifier: str = Field(..., description="Phone number or chat/bot ID")
    credentials: Dict[str, Any] = Field(..., description="Credentials payload to be encrypted at rest")
    settings: Optional[Dict[str, Any]] = None
    verify: Optional[bool] = Field(default=False, description="Whether to verify credentials with provider before connecting")


class ChannelVerifyRequest(BaseModel):
    channel_type: str = Field(..., description="whatsapp, telegram, slack")
    credentials: Dict[str, Any] = Field(..., description="Credentials payload to test")


class ChannelVerifyResponse(BaseModel):
    valid: bool
    message: str


class ChannelConnectionUpdate(BaseModel):
    external_identifier: Optional[str] = None
    is_active: Optional[bool] = None
    credentials: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None


class ChannelConnectionResponse(BaseModel):
    id: uuid.UUID
    channel_type: str
    external_identifier: str
    is_active: bool
    settings: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class IncomingWebhookPayload(BaseModel):
    channel_type: str
    external_sender_id: str
    message_text: str
    metadata: Optional[Dict[str, Any]] = None
