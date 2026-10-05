import pytest
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseFilter
from app.services.expense_service import ExpenseService
from app.services.analytics_service import AnalyticsService
from app.services.recurring_expense_service import RecurringExpenseService
from app.services.report_service import ReportService
from app.utils.datetime import utc_now


@pytest.mark.asyncio
async def test_expense_service_direct(db_session: AsyncSession, test_user: User):
    """Test business logic of ExpenseService independently from FastAPI."""
    service = ExpenseService(db_session)

    # Create expense
    exp_in = ExpenseCreate(
        amount=Decimal("199.99"),
        currency="USD",
        category="Entertainment",
        merchant="Cinema City",
        description="Movie tickets"
    )
    created = await service.create_expense(test_user.id, exp_in)
    assert created.amount == Decimal("199.99")
    assert created.category == "Entertainment"

    # List expenses
    items, total = await service.list_expenses(test_user.id, ExpenseFilter())
    assert total >= 1
    assert any(i.id == created.id for i in items)

    # Delete
    deleted = await service.delete_expense(created.id, test_user.id)
    assert deleted is True


@pytest.mark.asyncio
async def test_analytics_service_direct(db_session: AsyncSession, test_user: User):
    """Test business logic of AnalyticsService directly."""
    expense_service = ExpenseService(db_session)
    analytics_service = AnalyticsService(db_session)

    # Seed 2 expenses
    await expense_service.create_expense(
        test_user.id,
        ExpenseCreate(amount=Decimal("50.00"), category="Food & Dining", merchant="Cafe")
    )
    await expense_service.create_expense(
        test_user.id,
        ExpenseCreate(amount=Decimal("150.00"), category="Shopping", merchant="Mall")
    )

    data = await analytics_service.get_dashboard_analytics(test_user.id, period="this_month")
    assert data.summary.total_amount >= Decimal("200.00")
    assert data.summary.transaction_count >= 2
    assert len(data.categories) >= 2


@pytest.mark.asyncio
async def test_recurring_service_direct(db_session: AsyncSession, test_user: User):
    """Test subscription detection and automated processing in RecurringExpenseService."""
    expense_service = ExpenseService(db_session)
    recurring_service = RecurringExpenseService(db_session)

    # Create 2 repeated expenses for Netflix
    await expense_service.create_expense(
        test_user.id,
        ExpenseCreate(amount=Decimal("19.99"), category="Entertainment", merchant="Netflix")
    )
    await expense_service.create_expense(
        test_user.id,
        ExpenseCreate(amount=Decimal("19.99"), category="Entertainment", merchant="Netflix")
    )

    # Detect subscription pattern
    hint = await recurring_service.detect_potential_recurring(
        test_user.id, "Netflix", Decimal("19.99")
    )
    assert hint is not None
    assert "Netflix" in hint and "19.99" in hint

    # User confirms -> create recurring rule
    rec = await recurring_service.create_recurring(
        user_id=test_user.id,
        merchant="Netflix",
        amount=Decimal("19.99"),
        currency="USD",
        category="Entertainment",
        frequency="monthly"
    )
    assert rec.status == "active"
    assert rec.merchant == "Netflix"


@pytest.mark.asyncio
async def test_report_service_direct(db_session: AsyncSession, test_user: User):
    """Test ReportService generating data and rendering PNG bytes."""
    report_service = ReportService(db_session)
    expense_service = ExpenseService(db_session)

    await expense_service.create_expense(
        test_user.id,
        ExpenseCreate(amount=Decimal("75.00"), category="Food & Dining", merchant="Bistro")
    )

    report = await report_service.generate_report(test_user.id, period="this_month")
    assert report.id is not None
    assert report.status == "generated"
    assert "summary" in report.data
    assert report.data["summary"]["total_amount"] >= 75.0

    # Retrieve rendered image bytes
    image_bytes = await report_service.get_report_image(report.id, test_user.id)
    assert len(image_bytes) > 0
    assert image_bytes[:8] == b"\x89PNG\r\n\x1a\n"  # PNG magic header bytes!
