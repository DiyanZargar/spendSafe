from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.security.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    """Register a new user account."""
    return await service.register(data)


@router.post("/login", response_model=Token)
async def login(
    data: UserLogin,
    service: AuthService = Depends(get_auth_service)
) -> Token:
    """Authenticate and obtain JWT access token."""
    return await service.login(data)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """Get profile of current authenticated user."""
    return UserResponse.model_validate(current_user)
