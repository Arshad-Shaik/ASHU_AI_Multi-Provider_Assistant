# backend/app/services/memory/conversation.py
from typing import Optional
import httpx
from app.services.memory.id_generator import generate_memory_id
from app.core.config import get_settings


class MemoryEntry:
    def __init__(
        self,
        memory_id: str,
        user_prompt: str,
        ai_response: str,
        command_type: str,
        provider_used: str,
        user_id: Optional[str] = None,
        id: Optional[str] = None,
        tags: Optional[list[str]] = None,
        is_starred: bool = False,
        created_at: Optional[str] = None,
    ):
        self.id = id
        self.user_id = user_id
        self.memory_id = memory_id
        self.user_prompt = user_prompt
        self.ai_response = ai_response
        self.command_type = command_type
        self.provider_used = provider_used
        self.tags = tags or []
        self.is_starred = is_starred
        self.created_at = created_at

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "memory_id": self.memory_id,
            "user_prompt": self.user_prompt,
            "ai_response": self.ai_response,
            "command_type": self.command_type,
            "provider_used": self.provider_used,
            "tags": self.tags,
            "is_starred": self.is_starred,
            "created_at": self.created_at,
        }

    @staticmethod
    def from_row(row: dict) -> "MemoryEntry":
        return MemoryEntry(
            id=row.get("id"),
            user_id=row.get("user_id"),
            memory_id=row.get("memory_id", ""),
            user_prompt=row.get("user_prompt", ""),
            ai_response=row.get("ai_response", ""),
            command_type=row.get("command_type", "chat"),
            provider_used=row.get("provider_used", "unknown"),
            tags=row.get("tags") or [],
            is_starred=row.get("is_starred", False),
            created_at=row.get("created_at"),
        )


class MemoryStoreError(Exception):
    pass


class MemoryService:
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.SUPABASE_URL.rstrip("/")
        self.service_key = self.settings.SUPABASE_SERVICE_KEY or self.settings.SUPABASE_ANON_KEY

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
            raise MemoryStoreError("Supabase memory store is not configured")

    async def save_memory(
        self,
        user_id: str,
        user_prompt: str,
        ai_response: str,
        command_type: str,
        provider_used: str,
    ) -> MemoryEntry:
        self._require_configured()
        payload = {
            "user_id": user_id,
            "memory_id": generate_memory_id(),
            "user_prompt": user_prompt,
            "ai_response": ai_response,
            "command_type": command_type,
            "provider_used": provider_used,
        }
        url = self.base_url + "/rest/v1/memory_entries"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, json=payload, headers=self._headers())
            resp.raise_for_status()
            rows = resp.json()
        return MemoryEntry.from_row(rows[0])

    async def get_memory(self, memory_id: str, user_id: str) -> Optional[MemoryEntry]:
        self._require_configured()
        url = self.base_url + "/rest/v1/memory_entries"
        params = {"memory_id": "eq." + memory_id, "user_id": "eq." + user_id, "select": "*"}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params, headers=self._headers())
            resp.raise_for_status()
            rows = resp.json()
        if not rows:
            return None
        return MemoryEntry.from_row(rows[0])

    async def get_user_memories(self, user_id: str) -> list[MemoryEntry]:
        self._require_configured()
        url = self.base_url + "/rest/v1/memory_entries"
        params = {"user_id": "eq." + user_id, "select": "*", "order": "created_at.desc"}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params, headers=self._headers())
            resp.raise_for_status()
            rows = resp.json()
        return [MemoryEntry.from_row(r) for r in rows]

    async def delete_memory(self, memory_id: str, user_id: str) -> bool:
        self._require_configured()
        url = self.base_url + "/rest/v1/memory_entries"
        params = {"memory_id": "eq." + memory_id, "user_id": "eq." + user_id}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.delete(url, params=params, headers=self._headers())
            resp.raise_for_status()
            rows = resp.json()
        return len(rows) > 0


_memory_service: Optional[MemoryService] = None


def get_memory_service() -> MemoryService:
    global _memory_service
    if _memory_service is None:
        _memory_service = MemoryService()
    return _memory_service


async def save_memory(
    user_id: str,
    user_prompt: str,
    ai_response: str,
    command_type: str,
    provider_used: str,
) -> MemoryEntry:
    return await get_memory_service().save_memory(
        user_id=user_id,
        user_prompt=user_prompt,
        ai_response=ai_response,
        command_type=command_type,
        provider_used=provider_used,
    )


async def get_memory(memory_id: str, user_id: str) -> Optional[MemoryEntry]:
    return await get_memory_service().get_memory(memory_id, user_id)


async def get_user_memories(user_id: str) -> list[MemoryEntry]:
    return await get_memory_service().get_user_memories(user_id)


async def delete_memory(memory_id: str, user_id: str) -> bool:
    return await get_memory_service().delete_memory(memory_id, user_id)
