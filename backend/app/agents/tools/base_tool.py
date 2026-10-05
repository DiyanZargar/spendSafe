from abc import ABC, abstractmethod
from typing import Any, Dict
from app.agents.context import AgentUserContext


class BaseTool(ABC):
    """Base class for agent tool suites providing context and service bindings."""

    def __init__(self, user_context: AgentUserContext, services: Dict[str, Any]):
        self.context = user_context
        self.services = services

    @abstractmethod
    def get_tool_callables(self) -> list:
        """Return list of functions/callables bound with user context."""
        pass
