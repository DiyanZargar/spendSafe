import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.conversation import Conversation
from app.models.message import Message
from app.repositories.base_repository import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    """Repository for Conversation and Message management."""

    def __init__(self, session: AsyncSession):
        super().__init__(Conversation, session)

    async def get_or_create(
        self,
        user_id: uuid.UUID,
        channel: str = "web",
        external_id: Optional[str] = None
    ) -> Conversation:
        """Find an existing active conversation for the channel or create a new one."""
        query = select(Conversation).where(
            and_(
                Conversation.user_id == user_id,
                Conversation.channel == channel,
                Conversation.external_id == external_id
            )
        ).order_by(desc(Conversation.updated_at))

        result = await self.session.execute(query)
        conversation = result.scalars().first()

        if not conversation:
            conversation = Conversation(
                id=uuid.uuid4(),
                user_id=user_id,
                channel=channel,
                external_id=external_id,
                title=f"{channel.capitalize()} Conversation"
            )
            self.session.add(conversation)
            await self.session.flush()
            await self.session.refresh(conversation)

        return conversation

    async def add_message(
        self,
        conversation_id: uuid.UUID,
        sender_type: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Message:
        """Append a message to the conversation and update the conversation timestamp."""
        msg = Message(
            id=uuid.uuid4(),
            conversation_id=conversation_id,
            sender_type=sender_type,
            content=content,
            msg_metadata=metadata
        )
        self.session.add(msg)

        # Update conversation touched timestamp
        conv = await self.get(conversation_id)
        if conv:
            from app.utils.datetime import utc_now
            conv.updated_at = utc_now()

        await self.session.flush()
        await self.session.refresh(msg)
        return msg

    async def get_messages(
        self,
        conversation_id: uuid.UUID,
        limit: int = 50
    ) -> List[Message]:
        """Fetch messages in chronological order."""
        query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def list_by_user(
        self,
        user_id: uuid.UUID,
        limit: int = 20
    ) -> List[Conversation]:
        """List recent conversations for a user."""
        query = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
