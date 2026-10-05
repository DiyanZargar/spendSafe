import json
import base64
from typing import Any, Dict, Union
from cryptography.fernet import Fernet
from app.config import settings


def _get_fernet() -> Fernet:
    """Initialize Fernet using the configured CREDENTIALS_ENCRYPTION_KEY from settings."""
    key = settings.CREDENTIALS_ENCRYPTION_KEY
    if not key:
        # Fallback to a deterministic key derived from SECRET_KEY if not explicitly set
        import hashlib
        derived = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
        return Fernet(derived)

    # Ensure key is valid bytes
    if isinstance(key, str):
        key_bytes = key.encode("utf-8")
    else:
        key_bytes = key
    return Fernet(key_bytes)


def encrypt_credentials(data: Union[Dict[str, Any], str]) -> str:
    """Encrypt channel credentials (dict or string) to a base64 Fernet token."""
    fernet = _get_fernet()
    if isinstance(data, dict):
        raw = json.dumps(data)
    else:
        raw = str(data)
    encrypted_bytes = fernet.encrypt(raw.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")


def decrypt_credentials(token: str) -> Dict[str, Any]:
    """Decrypt a base64 Fernet token back to credentials dict."""
    fernet = _get_fernet()
    decrypted_bytes = fernet.decrypt(token.encode("utf-8"))
    decoded_str = decrypted_bytes.decode("utf-8")
    try:
        return json.loads(decoded_str)
    except json.JSONDecodeError:
        return {"value": decoded_str}
