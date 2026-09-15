# backend/app/services/memory/manager.py
from __future__ import annotations

import logging

from app.services.memory.conversation import ConversationRepository

logger = logging.getLogger("ashu_ai.memory_manager")

_repo_instance: ConversationRepository | None = None


def _get_shared_repo() -> ConversationRepository:
    global _repo_instance
    if _repo_instance is None:
        _repo_instance = ConversationRepository()
    return _repo_instance


class MemoryManager:
    def __init__(self) -> None:
        self._repo: ConversationRepository = _get_shared_repo()

    async def save_message(
        self,
        session_id: str,
        user_id: str | None,
        response_id: str,
        command_type: str,
        user_message: str,
        assistant_content: str,
        provider_used: str,
        tokens_used: int,
    ) -> dict:
        try:
            return await self._repo.save_message(
                session_id=session_id,
                user_id=user_id,
                response_id=response_id,
                command_type=command_type,
                user_message=user_message,
                assistant_content=assistant_content,
                provider_used=provider_used,
                tokens_used=tokens_used,
            )
        except Exception as exc:
            logger.warning("save_message failed: %s", exc)
            return {}

    async def get_response_by_id(self, response_id: str) -> dict | None:
        try:
            return await self._repo.get_response_by_id(response_id=response_id)
        except Exception as exc:
            logger.warning("get_response_by_id failed: %s", exc)
            return None

    async def get_session_history(
        self,
        session_id: str,
        limit: int = 50,
        offset: int = 0,
        user_id: str | None = None,
    ) -> dict:
        try:
            return await self._repo.get_session_history(
                session_id=session_id,
                limit=limit,
                offset=offset,
                user_id=user_id,
            )
        except Exception as exc:
            logger.warning("get_session_history failed: %s", exc)
            return {"messages": [], "total": 0}

    async def delete_session(self, session_id: str, user_id: str) -> bool:
        try:
            return await self._repo.delete_session(
                session_id=session_id,
                user_id=user_id,
            )
        except Exception as exc:
            logger.warning("delete_session failed: %s", exc)
            return False

    def get_repository(self) -> ConversationRepository:
        return self._repo


def get_memory_manager() -> MemoryManager:
    return MemoryManager()