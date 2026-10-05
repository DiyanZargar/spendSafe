from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.agents.context import AgentUserContext


class BaseAgent(ABC):
    """Abstract base class for all AI conversational agents."""

    def __init__(self, user_context: AgentUserContext, services: Dict[str, Any]):
        self.user_context = user_context
        self.context = user_context
        self.services = services
        self.agent_instance = None

    @abstractmethod
    def build_agent(self) -> Any:
        """Construct the underlying Agno Agent instance."""
        pass

    @abstractmethod
    def get_tools(self) -> List[Any]:
        """Return the callable tools available to this agent."""
        pass

    @abstractmethod
    async def run(self, message: str) -> str:
        """Process user message and return the conversational response."""
        pass
