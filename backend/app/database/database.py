from typing import Any
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator, JSON
from pgvector.sqlalchemy import Vector
from app.config import settings


class SafeVector(TypeDecorator):
    """
    Cross-dialect vector type:
    Uses pgvector Vector on PostgreSQL, falls back to JSON on SQLite (for test suites).
    """
    impl = JSON
    cache_ok = True

    def __init__(self, dim: int = 1536):
        super().__init__()
        self.dim = dim

    def load_dialect_impl(self, dialect: Any) -> Any:
        return dialect.type_descriptor(JSON())


class Base(DeclarativeBase):
    pass


# Async SQLAlchemy engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    future=True,
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)
