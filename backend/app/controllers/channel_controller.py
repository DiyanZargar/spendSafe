import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Request, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.schemas.channel import (
    ChannelConnectionCreate, ChannelConnectionUpdate, ChannelConnectionResponse,
    ChannelVerifyRequest, ChannelVerifyResponse
)
from app.services.channel_service import ChannelService
from app.services.conversation_service import ConversationService
from app.channels.channel_manager import ChannelManager
from app.security.auth import get_current_user

router = APIRouter(prefix="/channels", tags=["Channels & Webhooks"])


def get_channel_service(db: AsyncSession = Depends(get_db)) -> ChannelService:
    return ChannelService(db)


def get_conversation_service(db: AsyncSession = Depends(get_db)) -> ConversationService:
    return ConversationService(db)


@router.post("/verify", response_model=ChannelVerifyResponse)
async def verify_channel_credentials(
    data: ChannelVerifyRequest,
    current_user: User = Depends(get_current_user),
    service: ChannelService = Depends(get_channel_service)
) -> ChannelVerifyResponse:
    """Verify channel credentials live with external provider before saving."""
    try:
        is_valid = await service.verify_channel_credentials(data.channel_type, data.credentials)
        if is_valid:
            return ChannelVerifyResponse(
                valid=True,
                message=f"Credentials verified successfully with {data.channel_type.capitalize()}."
            )
        else:
            return ChannelVerifyResponse(
                valid=False,
                message=f"Verification failed. {data.channel_type.capitalize()} rejected the credentials."
            )
    except Exception as ex:
        return ChannelVerifyResponse(
            valid=False,
            message=f"Verification error: {str(ex)}"
        )


@router.post("/connect", response_model=ChannelConnectionResponse, status_code=status.HTTP_201_CREATED)
async def connect_channel(
    data: ChannelConnectionCreate,
    current_user: User = Depends(get_current_user),
    service: ChannelService = Depends(get_channel_service)
) -> ChannelConnectionResponse:
    """Connect external channel (WhatsApp, Telegram, Slack) with user credentials."""
    conn = await service.connect_channel(current_user.id, data)
    return ChannelConnectionResponse.model_validate(conn)


@router.get("/connections", response_model=List[ChannelConnectionResponse])
async def list_connections(
    current_user: User = Depends(get_current_user),
    service: ChannelService = Depends(get_channel_service)
) -> List[ChannelConnectionResponse]:
    """List connected channels for authenticated user (credentials are masked)."""
    connections = await service.list_connections(current_user.id)
    return [ChannelConnectionResponse.model_validate(c) for c in connections]


@router.delete("/connections/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ChannelService = Depends(get_channel_service)
) -> None:
    """Disconnect and remove a channel connection."""
    await service.delete_connection(id, current_user.id)


@router.put("/connections/{id}", response_model=ChannelConnectionResponse)
async def update_connection(
    id: uuid.UUID,
    data: ChannelConnectionUpdate,
    current_user: User = Depends(get_current_user),
    service: ChannelService = Depends(get_channel_service)
) -> ChannelConnectionResponse:
    """Update an existing channel connection (e.g. identifier, settings, or credentials)."""
    conn = await service.update_connection(id, current_user.id, data)
    return ChannelConnectionResponse.model_validate(conn)


@router.post("/webhook/{channel_type}")
async def handle_channel_webhook(
    channel_type: str,
    request: Request,
    channel_service: ChannelService = Depends(get_channel_service),
    conv_service: ConversationService = Depends(get_conversation_service),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Public webhook receiver for incoming channel messages (WhatsApp, Telegram, Slack).
    Resolves external sender to internal user_id and routes to ExpenseAgent.
    """
    channel_mgr = ChannelManager(db)

    # 1. Parse raw request body (JSON or Form data)
    try:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            raw_payload = await request.json()
        else:
            form = await request.form()
            raw_payload = dict(form)
    except Exception:
        raw_payload = {}

    # 2. Parse incoming normalized message
    try:
        parsed = await channel_mgr.parse_incoming(channel_type, raw_payload)
    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse channel webhook payload: {str(ex)}"
        )

    if not parsed.sender_id or not parsed.text:
        return {"status": "ignored", "reason": "empty sender or message"}

    # 3. Resolve user identity from channel connection
    user_id = await channel_service.resolve_identity(channel_type, parsed.sender_id)
    if not user_id:
        # Prompt user to connect this channel in settings
        fallback_msg = (
            f"Hello! Your {channel_type} account ({parsed.sender_id}) is not linked to any Expense Tracker account. "
            f"Please log in to the web app and connect {channel_type} in Settings."
        )
        await channel_mgr.send_message(
            user_id=uuid.uuid4(),
            channel_type=channel_type,
            recipient_id=parsed.sender_id,
            message=fallback_msg
        )
        return {"status": "unlinked_sender", "sender_id": parsed.sender_id}

    # 4. Process conversational turn through ExpenseAgent
    chat_response = await conv_service.handle_user_message(
        user_id=user_id,
        message_text=parsed.text,
        channel=channel_type,
        external_id=parsed.sender_id
    )

    # 5. Dispatch reply back to external channel
    await channel_mgr.send_message(
        user_id=user_id,
        channel_type=channel_type,
        recipient_id=parsed.sender_id,
        message=chat_response.reply
    )

    return {"status": "success", "reply": chat_response.reply}
