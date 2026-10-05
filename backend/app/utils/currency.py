from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any


CURRENCY_SYMBOLS: Dict[str, str] = {
    "USD": "$",
    "INR": "₹",
    "EUR": "€",
    "GBP": "£",
    "JPY": "¥",
    "CAD": "CA$",
    "AUD": "A$",
    "SGD": "S$",
    "AED": "AED",
}


def round_decimal(value: Any, places: int = 2) -> Decimal:
    """Safely convert and round a financial value to Decimal with 2 decimal places."""
    if value is None:
        return Decimal("0.00")
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    target_exp = Decimal(10) ** -places
    return value.quantize(target_exp, rounding=ROUND_HALF_UP)


def format_currency(amount: Decimal | float | int, currency: str = "USD") -> str:
    """Format monetary amount with currency symbol."""
    dec_amount = round_decimal(amount)
    symbol = CURRENCY_SYMBOLS.get(currency.upper(), currency.upper() + " ")
    return f"{symbol}{dec_amount:,.2f}"
