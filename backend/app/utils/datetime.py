from datetime import datetime, date, time, timedelta, timezone
from typing import Tuple
import calendar


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


def to_utc(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def get_period_range(
    period: str,
    custom_start: datetime | None = None,
    custom_end: datetime | None = None
) -> Tuple[datetime, datetime]:
    """
    Returns (start_datetime, end_datetime) in UTC for a named period.
    Supported periods: 'today', 'this_week', 'this_month', 'previous_month', 'this_year', 'custom'.
    """
    now = utc_now()
    today = now.date()

    period_normalized = period.lower().replace("-", "_").strip()

    if period_normalized == "today":
        start = datetime.combine(today, time.min, tzinfo=timezone.utc)
        end = datetime.combine(today, time.max, tzinfo=timezone.utc)
    elif period_normalized == "this_week":
        # Start on Monday
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
        start = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        end = datetime.combine(end_date, time.max, tzinfo=timezone.utc)
    elif period_normalized == "this_month":
        start_date = date(today.year, today.month, 1)
        _, last_day = calendar.monthrange(today.year, today.month)
        end_date = date(today.year, today.month, last_day)
        start = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        end = datetime.combine(end_date, time.max, tzinfo=timezone.utc)
    elif period_normalized == "previous_month":
        if today.month == 1:
            prev_year = today.year - 1
            prev_month = 12
        else:
            prev_year = today.year
            prev_month = today.month - 1
        start_date = date(prev_year, prev_month, 1)
        _, last_day = calendar.monthrange(prev_year, prev_month)
        end_date = date(prev_year, prev_month, last_day)
        start = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        end = datetime.combine(end_date, time.max, tzinfo=timezone.utc)
    elif period_normalized == "this_year":
        start_date = date(today.year, 1, 1)
        end_date = date(today.year, 12, 31)
        start = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        end = datetime.combine(end_date, time.max, tzinfo=timezone.utc)
    elif period_normalized == "custom" and custom_start and custom_end:
        start = to_utc(custom_start)
        end = to_utc(custom_end)
    else:
        # Default to this month
        start_date = date(today.year, today.month, 1)
        _, last_day = calendar.monthrange(today.year, today.month)
        end_date = date(today.year, today.month, last_day)
        start = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        end = datetime.combine(end_date, time.max, tzinfo=timezone.utc)

    return start, end


def parse_month_string(period_str: str) -> Tuple[datetime, datetime]:
    """
    Parse period strings like '2026-09', 'Sep 2026', 'September', or 'September 2026'
    into start and end UTC datetime bounds.
    """
    period_str = period_str.strip()
    now = utc_now()
    year = now.year

    # Try YYYY-MM
    try:
        parts = period_str.split("-")
        if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
            y, m = int(parts[0]), int(parts[1])
            _, last_day = calendar.monthrange(y, m)
            return (
                datetime(y, m, 1, 0, 0, 0, tzinfo=timezone.utc),
                datetime(y, m, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)
            )
    except Exception:
        pass

    # Try month name lookup
    month_names = {month.lower(): i for i, month in enumerate(calendar.month_name) if month}
    month_abbr = {month.lower(): i for i, month in enumerate(calendar.month_abbr) if month}
    all_months = {**month_names, **month_abbr}

    tokens = period_str.lower().split()
    target_month = None
    target_year = year

    for token in tokens:
        if token.isdigit() and len(token) == 4:
            target_year = int(token)
        elif token in all_months:
            target_month = all_months[token]

    if target_month is None:
        target_month = now.month

    _, last_day = calendar.monthrange(target_year, target_month)
    return (
        datetime(target_year, target_month, 1, 0, 0, 0, tzinfo=timezone.utc),
        datetime(target_year, target_month, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    )
