# backend/app/services/llm/router.py
import asyncio
import logging
import time
from typing import Optional

from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.services.llm.providers.gemini import GeminiProvider
from app.services.llm.providers.groq_provider import GroqProvider
from app.services.llm.providers.mistral_provider import MistralProvider
from app.services.llm.providers.cohere_provider import CohereProvider
from app.services.llm.providers.openrouter_provider import OpenRouterProvider
from app.services.llm.providers.openai_provider import OpenAIProvider
from app.services.llm.providers.claude_provider import ClaudeProvider
from app.services.llm.providers.cerebras_provider import CerebrasProvider
from app.services.llm.providers.together_provider import TogetherProvider
from app.services.llm.providers.deepseek_provider import DeepSeekProvider
from app.services.llm.providers.huggingface_provider import HuggingFaceProvider
from app.services.llm.providers.cloudflare_provider import CloudflareProvider
from app.services.llm.providers.grok_provider import GrokProvider

logger = logging.getLogger(__name__)

_PROVIDER_PRIORITY: list[BaseLLMProvider] = [
    GroqProvider(),
    MistralProvider(),
    CohereProvider(),
    GeminiProvider(),
    OpenRouterProvider(),
    OpenAIProvider(),
    ClaudeProvider(),
    CerebrasProvider(),
    TogetherProvider(),
    DeepSeekProvider(),
    HuggingFaceProvider(),
    CloudflareProvider(),
    GrokProvider(),
]

_ACTIVE_PROVIDERS = [p for p in _PROVIDER_PRIORITY if p.is_available()]
_WORKING_PROVIDERS = [p for p in _ACTIVE_PROVIDERS if p.is_available()]


class LLMRouter:
    def __init__(self) -> None:
        self._providers: list[BaseLLMProvider] = _WORKING_PROVIDERS
        self._failed_until: dict[str, float] = {}
        self._backoff_seconds = 60.0

    def _is_backed_off(self, provider_name: str) -> bool:
        until = self._failed_until.get(provider_name, 0.0)
        return time.monotonic() < until

    def _mark_failed(self, provider_name: str) -> None:
        self._failed_until[provider_name] = time.monotonic() + self._backoff_seconds

    def _clear_backoff(self, provider_name: str) -> None:
        self._failed_until.pop(provider_name, None)

    def get_available_providers(self) -> list[dict]:
        result = []
        for p in _PROVIDER_PRIORITY:
            backed_off = self._is_backed_off(p.provider_name)
            result.append({
                "name": p.provider_name,
                "model": p.model_name,
                "available": p.is_available() and not backed_off,
                "configured": p.is_configured(),
                "backed_off": backed_off,
            })
        return result

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        max_tokens: int = 4096,
        preferred_provider: Optional[str] = None,
    ) -> LLMResponse:
        providers = list(self._providers)

        if preferred_provider:
            preferred = [p for p in providers if p.provider_name == preferred_provider]
            rest = [p for p in providers if p.provider_name != preferred_provider]
            providers = preferred + rest

        last_error = "No providers available"
        tried: list[str] = []

        for provider in providers:
            if self._is_backed_off(provider.provider_name):
                logger.debug("Skipping %s ? backed off", provider.provider_name)
                continue

            tried.append(provider.provider_name)
            try:
                logger.info("Trying provider: %s", provider.provider_name)
                result = await asyncio.wait_for(
                    provider.generate(prompt, system_prompt, max_tokens),
                    timeout=55.0,
                )
                self._clear_backoff(provider.provider_name)
                result.providers_tried = tried
                result.fallback_triggered = len(tried) > 1
                logger.info(
                    "Provider %s succeeded model=%s latency=%.0fms",
                    provider.provider_name,
                    result.model,
                    result.latency_ms,
                )
                return result
            except asyncio.TimeoutError:
                last_error = f"{provider.provider_name} exceeded 55s timeout"
                self._mark_failed(provider.provider_name)
                logger.warning("Provider %s timed out", provider.provider_name)
            except Exception as exc:
                last_error = str(exc)
                self._mark_failed(provider.provider_name)
                logger.warning("Provider %s failed: %s", provider.provider_name, str(exc)[:100])

        raise RuntimeError(
            f"All providers failed. Tried: {tried}. Last error: {last_error}"
        )


_router_instance: Optional[LLMRouter] = None


def get_router() -> LLMRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = LLMRouter()
    return _router_instance
