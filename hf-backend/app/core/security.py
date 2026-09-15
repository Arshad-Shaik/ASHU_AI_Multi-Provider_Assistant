# backend/app/core/security.py
from __future__ import annotations

import re
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth.supabase_auth import SupabaseUser, get_auth_service, AuthenticationError

_bearer_scheme = HTTPBearer(auto_error=False)

SCRIPT_PATTERN = re.compile(r"<script[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL)
JS_PATTERN = re.compile(r"javascript:", re.IGNORECASE)
EVENT_PATTERN = re.compile(r"on\w+\s*=", re.IGNORECASE)


def sanitize_input(text: str, max_length: int = 8000) -> str:
    result = SCRIPT_PATTERN.sub("", text)
    result = JS_PATTERN.sub("", result)
    result = EVENT_PATTERN.sub("", result)
    return result.strip()[:max_length]


def is_valid_session_id(session_id: str) -> bool:
    return bool(re.match(r"^[A-Za-z0-9_-]{4,128}$", session_id))


def is_valid_memory_id(memory_id: str) -> bool:
    return bool(re.match(r"^MEM_[A-Z0-9_]+$", memory_id, re.IGNORECASE))


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)
    ] = None,
) -> SupabaseUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        auth_service = get_auth_service()
        user = await auth_service.verify_token(credentials.credentials)
        return user
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)
    ] = None,
) -> SupabaseUser | None:
    if credentials is None:
        return None
    try:
        auth_service = get_auth_service()
        return await auth_service.verify_token(credentials.credentials)
    except AuthenticationError:
        return None


CurrentUser = Annotated[SupabaseUser, Depends(get_current_user)]
OptionalUser = Annotated[SupabaseUser | None, Depends(get_optional_user)]