# backend/app/utils/sanitizer.py
import re


def sanitize_prompt(text: str, max_length: int = 8000) -> str:
    patterns = [
        re.compile(r"<script[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL),
        re.compile(r"javascript:", re.IGNORECASE),
    ]
    result = text
    for pattern in patterns:
        result = pattern.sub("", result)
    return result.strip()[:max_length]


def sanitize_code(code: str, max_length: int = 8000) -> str:
    return code.strip()[:max_length]


def truncate_response(text: str, max_length: int = 16000) -> str:
    if len(text) <= max_length:
        return text
    return text[:max_length] + "

[Response truncated...]"
