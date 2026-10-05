from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.database import engine, Base
from app.controllers.auth_controller import router as auth_router
from app.controllers.expense_controller import router as expense_router
from app.controllers.analytics_controller import router as analytics_router
from app.controllers.conversation_controller import router as conversation_router
from app.controllers.channel_controller import router as channel_router
from app.controllers.report_controller import router as report_router
from app.controllers.llm_controller import router as llm_router


from app.channels.telegram_poller import start_telegram_poller, stop_telegram_poller


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup initialization and clean shutdown."""
    # Ensure tables exist in development / SQLite mode
    if "sqlite" in settings.DATABASE_URL:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    # Start background Telegram long-poller
    start_telegram_poller()

    yield

    # Teardown
    stop_telegram_poller()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Agentic Multi-User Expense Management Platform (Modular Monolith MVC)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
origins = settings.CORS_ORIGINS
if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Health Check
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT
    }


# Register domain controllers with /api/v1 prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(expense_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(conversation_router, prefix=settings.API_V1_STR)
app.include_router(channel_router, prefix=settings.API_V1_STR)
app.include_router(report_router, prefix=settings.API_V1_STR)
app.include_router(llm_router, prefix=settings.API_V1_STR)
