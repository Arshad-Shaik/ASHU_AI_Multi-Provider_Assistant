# backend/app/services/memory/id_generator.py
import secrets
import string
from datetime import datetime, timezone

_ALPHABET = string.ascii_uppercase + string.digits


def _random_suffix(length: int) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


def generate_memory_id() -> str:
    year = datetime.now(timezone.utc).year
    suffix = _random_suffix(8)
    return f"MEM_{year}_{suffix}"


def generate_session_id() -> str:
    suffix = _random_suffix(12)
    return f"SES_{suffix}"


def generate_message_id() -> str:
    suffix = _random_suffix(10)
    return f"MSG_{suffix}"