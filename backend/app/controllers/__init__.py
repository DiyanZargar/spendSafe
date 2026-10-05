from app.controllers.auth_controller import router as auth_router
from app.controllers.expense_controller import router as expense_router
from app.controllers.analytics_controller import router as analytics_router
from app.controllers.conversation_controller import router as conversation_router
from app.controllers.channel_controller import router as channel_router
from app.controllers.report_controller import router as report_router

__all__ = [
    "auth_router",
    "expense_router",
    "analytics_router",
    "conversation_router",
    "channel_router",
    "report_router",
]
