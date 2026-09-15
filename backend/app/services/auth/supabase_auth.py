# backend/app/services/auth/supabase_auth.py
from __future__ import annotations

import httpx
from pydantic import BaseModel
from app.core.config import get_settings


class SupabaseUser(BaseModel):
    id: str
    email: str
    role: str = "authenticated"


class AuthenticationError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class SupabaseAuthService:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._base_url = self._settings.SUPABASE_URL.rstrip("/")
        self._anon_key = self._settings.SUPABASE_ANON_KEY

    def is_configured(self) -> bool:
        return bool(self._base_url and self._anon_key)

    async def verify_token(self, token: str) -> SupabaseUser:
        if not self.is_configured():
            raise AuthenticationError(
                "Authentication service is not configured. "
                "Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env",
                status_code=503,
            )
        if not token or not token.strip():
            raise AuthenticationError("Missing authentication token", status_code=401)

        url = self._base_url + "/auth/v1/user"
        headers = {
            "Authorization": "Bearer " + token.strip(),
            "apikey": self._anon_key,
        }

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)
            ) as client:
                response = await client.get(url, headers=headers)
        except httpx.TimeoutException as exc:
            raise AuthenticationError(
                "Authentication service timed out. Please try again.",
                status_code=503,
            ) from exc
        except httpx.RequestError as exc:
            raise AuthenticationError(
                "Unable to reach authentication service: " + str(exc),
                status_code=503,
            ) from exc

        if response.status_code == 401:
            raise AuthenticationError(
                "Session expired or invalid. Please sign in again.",
                status_code=401,
            )
        if response.status_code == 403:
            raise AuthenticationError(
                "Access forbidden. Your session may have been revoked.",
                status_code=403,
            )
        if response.status_code != 200:
            raise AuthenticationError(
                f"Authentication check failed with status {response.status_code}",
                status_code=401,
            )

        try:
            data: dict = response.json()
        except Exception as exc:
            raise AuthenticationError(
                "Malformed response from authentication service",
                status_code=503,
            ) from exc

        user_id: str | None = data.get("id")
        email: str | None = data.get("email")

        if not user_id or not email:
            raise AuthenticationError(
                "Incomplete user data returned from authentication service",
                status_code=401,
            )

        return SupabaseUser(
            id=user_id,
            email=email,
            role=data.get("role", "authenticated"),
        )


_auth_service: SupabaseAuthService | None = None


def get_auth_service() -> SupabaseAuthService:
    global _auth_service
    if _auth_service is None:
        _auth_service = SupabaseAuthService()
    return _auth_service