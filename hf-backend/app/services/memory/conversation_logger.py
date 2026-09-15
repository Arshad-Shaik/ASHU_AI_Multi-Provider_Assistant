# backend/app/services/memory/conversation_logger.py
import secrets
import string
from datetime import datetime, timezone
from typing import Optional
import httpx
from app.core.config import get_settings

_ID_ALPHABET = string.ascii_uppercase + string.digits


def _generate_id(prefix: str) -> str:
    year = datetime.now(timezone.utc).year
    suffix = "".join(secrets.choice(_ID_ALPHABET) for _ in range(8))
    return f"{prefix}_{year}_{suffix}"


class ConversationLogError(Exception):
    pass


class ConversationLogger:
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.SUPABASE_URL.rstrip("/")
        self.service_key = self.settings.SUPABASE_SERVICE_KEY

    def is_configured(self) -> bool:
        return bool(self.base_url and self.service_key)

    def _headers(self) -> dict:
        return {
            "apikey": self.service_key,
            "Authorization": "Bearer " + self.service_key,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _require_configured(self) -> None:
        if not self.is_configured():
            raise ConversationLogError("Supabase conversation log store is not configured")

    async def _find_conversation_id(self, client: httpx.AsyncClient, session_id: str, user_id: str) -> Optional[str]:
        url = self.base_url + "/rest/v1/conversations"
        params = {"session_id": "eq." + session_id, "user_id": "eq." + user_id, "select": "id", "limit": "1"}
        resp = await client.get(url, params=params, headers=self._headers())
        resp.raise_for_status()
        rows = resp.json()
        if rows:
            return rows[0].get("id")
        return None

    async def _create_conversation(
        self, client: httpx.AsyncClient, session_id: str, user_id: str, command_type: str, title: str
    ) -> str:
        conversation_id = _generate_id("CONV")
        payload = {
            "id": conversation_id,
            "session_id": session_id,
            "user_id": user_id,
            "title": title[:60] if title else "Untitled Conversation",
            "command_type": command_type,
            "message_count": 0,
        }
        url = self.base_url + "/rest/v1/conversations"
        resp = await client.post(url, json=payload, headers=self._headers())
        resp.raise_for_status()
        rows = resp.json()
        return rows[0]["id"]

    async def _update_conversation_meta(
        self, client: httpx.AsyncClient, conversation_id: str, provider_used: str, message_count_increment: int
    ) -> None:
        url = self.base_url + "/rest/v1/conversations"
        headers = self._headers()
        get_resp = await client.get(url, params={"id": "eq." + conversation_id, "select": "message_count"}, headers=headers)
        get_resp.raise_for_status()
        rows = get_resp.json()
        current_count = rows[0]["message_count"] if rows else 0
        payload = {
            "last_provider_used": provider_used,
            "provider_used": provider_used,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "message_count": current_count + message_count_increment,
        }
        await client.patch(url, params={"id": "eq." + conversation_id}, json=payload, headers=headers)

    async def _insert_message(
        self,
        client: httpx.AsyncClient,
        conversation_id: str,
        session_id: str,
        role: str,
        content: str,
        command_type: str,
        provider_name: Optional[str],
        memory_id: Optional[str],
        tokens_used: Optional[int],
        latency_ms: Optional[float],
    ) -> None:
        message_id = _generate_id("MSG")
        payload = {
            "id": message_id,
            "conversation_id": conversation_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "command_type": command_type,
            "provider_name": provider_name,
            "provider": provider_name,
            "total_tokens": tokens_used or 0,
            "tokens_used": tokens_used or 0,
            "latency_ms": latency_ms or 0,
            "memory_id": memory_id,
        }
        url = self.base_url + "/rest/v1/messages"
        resp = await client.post(url, json=payload, headers=self._headers())
        resp.raise_for_status()

    async def log_exchange(
        self,
        user_id: str,
        session_id: str,
        command_type: str,
        provider: str,
        user_prompt: str,
        ai_response: str,
        memory_id: Optional[str] = None,
        tokens_used: Optional[int] = None,
        latency_ms: Optional[float] = None,
    ) -> None:
        self._require_configured()
        async with httpx.AsyncClient(timeout=15) as client:
            conversation_id = await self._find_conversation_id(client, session_id, user_id)
            if conversation_id is None:
                conversation_id = await self._create_conversation(client, session_id, user_id, command_type, user_prompt)

            await self._insert_message(
                client, conversation_id, session_id, "user", user_prompt, command_type, None, None, None, None
            )
            await self._insert_message(
                client, conversation_id, session_id, "assistant", ai_response, command_type, provider, memory_id, tokens_used, latency_ms
            )
            await self._update_conversation_meta(client, conversation_id, provider, message_count_increment=2)


_conversation_logger: Optional[ConversationLogger] = None


def get_conversation_logger() -> ConversationLogger:
    global _conversation_logger
    if _conversation_logger is None:
        _conversation_logger = ConversationLogger()
    return _conversation_logger


async def log_exchange(
    user_id: str,
    session_id: str,
    command_type: str,
    provider: str,
    user_prompt: str,
    ai_response: str,
    memory_id: Optional[str] = None,
    tokens_used: Optional[int] = None,
    latency_ms: Optional[float] = None,
) -> None:
    await get_conversation_logger().log_exchange(
        user_id=user_id,
        session_id=session_id,
        command_type=command_type,
        provider=provider,
        user_prompt=user_prompt,
        ai_response=ai_response,
        memory_id=memory_id,
        tokens_used=tokens_used,
        latency_ms=latency_ms,
    )