from typing import Generic, TypeVar, Optional, List
from uuid import UUID
from app.repositories.base_repository import BaseRepository
from app.database.database import Base

T = TypeVar("T", bound=Base)


class BaseService(Generic[T]):
    """Base class for domain service orchestration."""

    def __init__(self, repository: BaseRepository[T]):
        self.repository = repository

    async def get_by_id(self, id: UUID) -> Optional[T]:
        return await self.repository.get(id)

    async def list_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        return await self.repository.list(limit=limit, offset=offset)
