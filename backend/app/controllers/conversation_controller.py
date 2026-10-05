import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.schemas.conversation import ChatRequest, ChatResponse, ConversationResponse
from app.services.conversation_service import ConversationService
from app.security.auth import get_current_user

router = APIRouter(prefix="/conversations", tags=["Conversations & AI Chat"])


def get_conversation_service(db: AsyncSession = Depends(get_db)) -> ConversationService:
    return ConversationService(db)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service)
) -> ChatResponse:
    """Send natural language message to the Agno Expense Agent."""
    return await service.handle_user_message(
        user_id=current_user.id,
        message_text=data.message,
        channel=data.channel,
        conversation_id=data.conversation_id
    )


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service)
) -> List[ConversationResponse]:
    """List recent conversation threads for the user."""
    return await service.list_user_conversations(current_user.id)


@router.get("/{id}", response_model=ConversationResponse)
async def get_conversation(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service)
) -> ConversationResponse:
    """Get conversation session with full message history."""
    conv = await service.get_conversation(id, current_user.id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )
    return conv
