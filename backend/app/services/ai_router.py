# backend/app/services/ai_router.py
from __future__ import annotations

import logging
from typing import AsyncGenerator

from app.services.llm.router import LLMRouter

logger = logging.getLogger("ashu_ai.ai_router")

_router_instance: LLMRouter | None = None


def _get_shared_router() -> LLMRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = LLMRouter()
    return _router_instance


class AIRouter:
    def __init__(self) -> None:
        self._router: LLMRouter = _get_shared_router()

    async def stream_with_fallback(
        self,
        messages: list[dict],
        command_type: str = "chat",
        provider_preference: str | None = None,
    ) -> AsyncGenerator[dict, None]:
        async for chunk in self._router.stream_with_fallback(
            messages=messages,
            command_type=command_type,
            provider_preference=provider_preference,
        ):
            yield chunk

    async def complete_with_fallback(
        self,
        messages: list[dict],
        command_type: str = "chat",
        provider_preference: str | None = None,
    ) -> dict:
        return await self._router.complete_with_fallback(
            messages=messages,
            command_type=command_type,
            provider_preference=provider_preference,
        )

    async def get_all_provider_status(self) -> dict:
        return await self._router.get_all_provider_status()

    def get_router(self) -> LLMRouter:
        return self._router


def get_ai_router() -> AIRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = LLMRouter()
    return AIRouter()