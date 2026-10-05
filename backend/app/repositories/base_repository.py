from typing import Generic, TypeVar, Type, Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sa_delete
from app.database.database import Base

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """Generic repository providing standard CRUD operations."""

    def __init__(self, model_class: Type[T], session: AsyncSession):
        self.model_class = model_class
        self.session = session

    async def get(self, id: UUID) -> Optional[T]:
        """Retrieve an entity by primary key ID."""
        return await self.session.get(self.model_class, id)

    async def get_by_id(self, id: UUID) -> Optional[T]:
        """Alias for get(id)."""
        return await self.get(id)

    async def create(self, entity: T) -> T:
        """Persist a new entity and flush."""
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: T) -> T:
        """Update an existing entity."""
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, id: UUID) -> None:
        """Delete an entity by primary key ID."""
        entity = await self.get(id)
        if entity:
            await self.session.delete(entity)
            await self.session.flush()

    async def list(self, limit: int = 100, offset: int = 0) -> List[T]:
        """List entities with pagination."""
        query = select(self.model_class).limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())
