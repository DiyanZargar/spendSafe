from decimal import Decimal
from uuid import UUID
from datetime import datetime, date
import json
from typing import Any


class CustomJSONEncoder(json.JSONEncoder):
    """JSON Encoder that supports UUID, Decimal, and datetime objects."""

    def default(self, obj: Any) -> Any:
        if isinstance(obj, UUID):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def json_dumps(data: Any) -> str:
    """Serialize data using custom JSON encoder."""
    return json.dumps(data, cls=CustomJSONEncoder)


def json_loads(data: str) -> Any:
    """Deserialize JSON string."""
    return json.loads(data)
