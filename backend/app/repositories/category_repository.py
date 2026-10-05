import uuid
from typing import Optional, List
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from app.repositories.base_repository import BaseRepository

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining", "icon": "utensils", "color": "#f97316"},
    {"name": "Groceries", "icon": "shopping-cart", "color": "#10b981"},
    {"name": "Transportation", "icon": "car", "color": "#06b6d4"},
    {"name": "Shopping", "icon": "shopping-bag", "color": "#ec4899"},
    {"name": "Bills & Utilities", "icon": "file-text", "color": "#ef4444"},
    {"name": "Entertainment", "icon": "film", "color": "#8b5cf6"},
    {"name": "Health & Wellness", "icon": "heart", "color": "#14b8a6"},
    {"name": "Travel", "icon": "plane", "color": "#3b82f6"},
    {"name": "Personal Care", "icon": "smile", "color": "#f59e0b"},
    {"name": "Other", "icon": "more-horizontal", "color": "#6b7280"},
]


class CategoryRepository(BaseRepository[Category]):
    """Repository for Category operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(Category, session)

    async def list_for_user(self, user_id: uuid.UUID) -> List[Category]:
        """Fetch system default categories plus custom categories created by this user."""
        query = (
            select(Category)
            .where(
                or_(
                    Category.user_id == None,  # System default
                    Category.user_id == user_id
                )
            )
            .order_by(Category.is_default.desc(), Category.name.asc())
        )
        result = await self.session.execute(query)
        categories = list(result.scalars().all())

        # If system categories haven't been seeded yet, seed them on-the-fly
        if not categories:
            await self.seed_defaults()
            return await self.list_for_user(user_id)

        return categories

    async def get_by_name(self, user_id: uuid.UUID, name: str) -> Optional[Category]:
        """Find category by case-insensitive name matching user or system categories."""
        clean_name = name.strip().lower()
        query = select(Category).where(
            and_(
                or_(Category.user_id == None, Category.user_id == user_id),
                func.lower(Category.name) == clean_name
            )
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def seed_defaults(self) -> None:
        """Seed standard default categories if they do not exist."""
        for item in DEFAULT_CATEGORIES:
            exists_q = select(Category).where(
                and_(Category.user_id == None, func.lower(Category.name) == item["name"].lower())
            )
            exists = (await self.session.execute(exists_q)).scalar_one_or_none()
            if not exists:
                cat = Category(
                    id=uuid.uuid4(),
                    user_id=None,
                    name=item["name"],
                    icon=item["icon"],
                    color=item["color"],
                    is_default=True
                )
                self.session.add(cat)
        await self.session.flush()
