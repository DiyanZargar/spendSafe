import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import ChatResponse, ConversationResponse, MessageResponse
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.user_repository import UserRepository
from app.agents.context import AgentUserContext
from app.agents.expense_agent import ExpenseAgent
from app.services.expense_service import ExpenseService
from app.services.analytics_service import AnalyticsService
from app.services.recurring_expense_service import RecurringExpenseService
from app.services.report_service import ReportService
from app.services.base_service import BaseService


from app.security.encryption import decrypt_credentials


class ConversationService(BaseService[Conversation]):
    """Coordinates conversational sessions, chat message history, and AI Agent routing."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.conv_repo = ConversationRepository(session)
        self.user_repo = UserRepository(session)
        super().__init__(self.conv_repo)

    def _get_services_dict(self) -> Dict[str, Any]:
        """Assemble domain services required by agent tools."""
        return {
            "expense_service": ExpenseService(self.session),
            "analytics_service": AnalyticsService(self.session),
            "recurring_service": RecurringExpenseService(self.session),
            "report_service": ReportService(self.session),
        }

    async def handle_user_message(
        self,
        user_id: uuid.UUID,
        message_text: str,
        channel: str = "web",
        external_id: Optional[str] = None,
        conversation_id: Optional[uuid.UUID] = None
    ) -> ChatResponse:
        """Process incoming user message through conversation history and AI Agent."""
        # 1. Fetch user to obtain profile defaults and user-configured LLM credentials
        user = await self.user_repo.get(user_id)
        currency = user.currency if user else "USD"
        tz = user.timezone if user else "UTC"

        user_llm_provider = user.llm_provider if user else None
        user_llm_model = user.llm_model if user else None
        user_llm_base_url = user.llm_base_url if user else None
        user_llm_api_key = None

        if user and user.llm_api_key_encrypted:
            try:
                decrypted = decrypt_credentials(user.llm_api_key_encrypted)
                user_llm_api_key = decrypted.get("api_key") or decrypted.get("value", "")
            except Exception:
                user_llm_api_key = None

        # 2. Get or create conversation session
        if conversation_id:
            conv = await self.conv_repo.get(conversation_id)
            if not conv or conv.user_id != user_id:
                conv = await self.conv_repo.get_or_create(user_id, channel, external_id)
        else:
            conv = await self.conv_repo.get_or_create(user_id, channel, external_id)

        # 3. Store incoming user message
        await self.conv_repo.add_message(
            conversation_id=conv.id,
            sender_type="user",
            content=message_text.strip()
        )

        # 4. Assemble Agent User Context with decrypted user LLM details
        context = AgentUserContext(
            user_id=user_id,
            timezone=tz,
            currency=currency,
            channel=channel,
            conversation_id=conv.id,
            llm_provider=user_llm_provider,
            llm_model=user_llm_model,
            llm_api_key=user_llm_api_key,
            llm_base_url=user_llm_base_url,
        )

        # 5. Execute Agent
        agent = ExpenseAgent(context, self._get_services_dict())
        reply_text = await agent.run(message_text.strip())

        # 6. Store assistant reply
        await self.conv_repo.add_message(
            conversation_id=conv.id,
            sender_type="assistant",
            content=reply_text
        )

        return ChatResponse(
            reply=reply_text,
            conversation_id=conv.id
        )

    async def get_conversation(self, conversation_id: uuid.UUID, user_id: uuid.UUID) -> Optional[ConversationResponse]:
        """Fetch conversation details and messages."""
        conv = await self.conv_repo.get(conversation_id)
        if not conv or conv.user_id != user_id:
            return None

        messages = await self.conv_repo.get_messages(conv.id)
        msg_responses = [
            MessageResponse(
                id=m.id,
                sender_type=m.sender_type,
                content=m.content,
                metadata=m.msg_metadata,
                created_at=m.created_at
            )
            for m in messages
        ]

        return ConversationResponse(
            id=conv.id,
            channel=conv.channel,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages=msg_responses
        )

    async def list_user_conversations(self, user_id: uuid.UUID) -> List[ConversationResponse]:
        """List active conversations for a user."""
        convs = await self.conv_repo.list_by_user(user_id)
        return [
            ConversationResponse(
                id=c.id,
                channel=c.channel,
                title=c.title,
                created_at=c.created_at,
                updated_at=c.updated_at,
                messages=[]
            )
            for c in convs
        ]
