import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    ExpenseFilter, ExpenseListResponse, CategoryResponse
)
from app.services.expense_service import ExpenseService
from app.security.auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def get_expense_service(db: AsyncSession = Depends(get_db)) -> ExpenseService:
    return ExpenseService(db)


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    service: ExpenseService = Depends(get_expense_service)
) -> ExpenseResponse:
    """Record a new expense."""
    expense = await service.create_expense(current_user.id, data)
    return ExpenseResponse.model_validate(expense)


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    filter_params: ExpenseFilter = Depends(),
    current_user: User = Depends(get_current_user),
    service: ExpenseService = Depends(get_expense_service)
) -> ExpenseListResponse:
    """List expenses for authenticated user with filters and pagination."""
    items, total = await service.list_expenses(current_user.id, filter_params)
    return ExpenseListResponse(
        items=[ExpenseResponse.model_validate(i) for i in items],
        total=total,
        limit=filter_params.limit,
        offset=filter_params.offset
    )


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    current_user: User = Depends(get_current_user),
    service: ExpenseService = Depends(get_expense_service)
) -> List[CategoryResponse]:
    """List available expense categories for user."""
    categories = await service.list_categories(current_user.id)
    return [CategoryResponse.model_validate(c) for c in categories]


@router.get("/{id}", response_model=ExpenseResponse)
async def get_expense(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ExpenseService = Depends(get_expense_service)
) -> ExpenseResponse:
    """Get single expense details by ID."""
    expense = await service.get_expense(id, current_user.id)
    return ExpenseResponse.model_validate(expense)


@router.patch("/{id}", response_model=ExpenseResponse)
async def update_expense(
    id: uuid.UUID,
    data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    service: ExpenseService = Depends(get_expense_service)
) -> ExpenseResponse:
    """Update an expense."""
    expense = await service.update_expense(id, current_user.id, data)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ExpenseService = Depends(get_expense_service)
) -> None:
    """Delete an expense."""
    await service.delete_expense(id, current_user.id)
