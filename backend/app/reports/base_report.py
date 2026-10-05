from abc import ABC, abstractmethod
import uuid
from typing import Dict, Any


class BaseReport(ABC):
    """Abstract base class for periodic financial reports."""

    @abstractmethod
    async def generate(self, user_id: uuid.UUID, period: str) -> Dict[str, Any]:
        """Aggregate data metrics for the given user and period."""
        pass

    @abstractmethod
    async def render(self, data: Dict[str, Any]) -> bytes:
        """Render aggregated report data to a visual PNG image byte stream."""
        pass
