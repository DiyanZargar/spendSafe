from sqlalchemy import select
from app.database.database import async_session_maker
from app.models.user import User
from app.models.channel_connection import ChannelConnection
from app.repositories.expense_repository import ExpenseRepository
from app.channels.channel_manager import ChannelManager
from app.utils.datetime import get_period_range


async def run_daily_reminder_job(ctx=None) -> int:
    """
    Checks each active user to see if they've recorded expenses today.
    Sends a friendly reminder message via their connected channel if they haven't.
    """
    reminders_sent = 0
    async with async_session_maker() as session:
        # Fetch active users
        query = select(User).where(User.is_active == True)
        result = await session.execute(query)
        users = list(result.scalars().all())

        expense_repo = ExpenseRepository(session)
        channel_mgr = ChannelManager(session)
        start_today, end_today = get_period_range("today")

        for user in users:
            # Check if user has an active channel connection
            conn_q = select(ChannelConnection).where(
                ChannelConnection.user_id == user.id,
                ChannelConnection.is_active == True
            )
            connections = (await session.execute(conn_q)).scalars().all()
            if not connections:
                continue

            # Check if expenses were recorded today
            summary = await expense_repo.get_summary(user.id, start_today, end_today)
            if summary["transaction_count"] == 0:
                # User has not recorded anything today, send reminder
                reminder_text = (
                    f"Hi {user.full_name.split()[0]}! 👋 Quick check-in from your Expense Tracker: "
                    f"What did you spend today? You can reply directly with things like 'Spent 250 on lunch'."
                )
                preferred_conn = connections[0]
                await channel_mgr.send_message(
                    user_id=user.id,
                    channel_type=preferred_conn.channel_type,
                    recipient_id=preferred_conn.external_identifier,
                    message=reminder_text
                )
                reminders_sent += 1

    return reminders_sent
