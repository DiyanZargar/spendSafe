from arq.cron import cron
from app.workers.daily_reminder import run_daily_reminder_job
from app.workers.recurring_expenses import run_recurring_expenses_job


def get_scheduled_cron_jobs():
    """Define recurring cron jobs for ARQ background worker."""
    return [
        # Process due recurring expenses every night at 00:05 UTC
        cron(run_recurring_expenses_job, hour=0, minute=5, name="process_recurring_expenses"),
        # Daily spending reminder check-in at 20:00 UTC (8 PM)
        cron(run_daily_reminder_job, hour=20, minute=0, name="daily_spending_reminder"),
    ]
