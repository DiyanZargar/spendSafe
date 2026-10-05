import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.repositories.user_repository import UserRepository
from app.repositories.category_repository import CategoryRepository
from app.security.password import get_password_hash, verify_password
from app.security.auth import create_access_token
from app.services.base_service import BaseService


class AuthService(BaseService[User]):
    """Service handling user registration, authentication, and JWT lifecycle."""

    def __init__(self, session: AsyncSession):
        self.user_repo = UserRepository(session)
        self.category_repo = CategoryRepository(session)
        super().__init__(self.user_repo)

    async def register(self, user_in: UserCreate) -> UserResponse:
        """Register a new user account with hashed password."""
        existing = await self.user_repo.get_by_email(user_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        hashed_password = get_password_hash(user_in.password)
        new_user = User(
            id=uuid.uuid4(),
            email=user_in.email.lower().strip(),
            hashed_password=hashed_password,
            full_name=user_in.full_name.strip(),
            currency=user_in.currency.upper().strip(),
            timezone=user_in.timezone.strip(),
            is_active=True
        )

        created_user = await self.user_repo.create(new_user)
        # Ensure default categories are initialized
        await self.category_repo.seed_defaults()

        return UserResponse.model_validate(created_user)

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Verify user credentials."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def login(self, login_in: UserLogin) -> Token:
        """Authenticate user and return signed JWT access token."""
        user = await self.authenticate(login_in.email, login_in.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This user account is inactive."
            )

        token_data = {
            "sub": str(user.id),
            "email": user.email,
        }
        access_token = create_access_token(data=token_data)

        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
