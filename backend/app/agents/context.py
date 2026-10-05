import uuid
from typing import Optional
from pydantic import BaseModel, Field


class AgentUserContext(BaseModel):
    """Execution context injected into the agent and tools for strict user isolation."""
    user_id: uuid.UUID
    timezone: str = Field(default="UTC")
    currency: str = Field(default="USD")
    channel: str = Field(default="web")
    conversation_id: Optional[uuid.UUID] = None
    channel_connection_id: Optional[uuid.UUID] = None
    # User-configured LLM details
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None
    llm_base_url: Optional[str] = None
