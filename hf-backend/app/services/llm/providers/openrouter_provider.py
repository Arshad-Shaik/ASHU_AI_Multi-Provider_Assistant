# backend/app/services/llm/providers/openrouter_provider.py
import time
import asyncio
import httpx
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings

_OPENROUTER_FREE_MODELS = [
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "inclusionai/ling-3.0-flash-sante:free",
    "cohere/north-mini-code:free",
    "nvidia/nemotron-3.5-content-safety:free",
    "dots-studio/dots-3-note-preview:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3.5-lightning:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "inclusionai/ling-3.0-flash-fin:free",
    "poolside/laguna-s-2.1:free",
    "poolside/laguna-xs-2.1:free",
    "openrouter/free",
]

_PER_MODEL_TIMEOUT = 22.0


class OpenRouterProvider(BaseLLMProvider):
    provider_name = "openrouter"
    model_name = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.OPENROUTER_API_KEY
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    def is_available(self) -> bool:
        return bool(self.api_key)

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _extract_content(self, data: dict) -> str:
        choices = data.get("choices", [])
        if not choices:
            return ""
        choice = choices[0]
        message = choice.get("message") or {}
        content = message.get("content")
        if content is not None and str(content).strip():
            return str(content).strip()
        text = choice.get("text")
        if text is not None and str(text).strip():
            return str(text).strip()
        delta = choice.get("delta") or {}
        delta_content = delta.get("content")
        if delta_content is not None and str(delta_content).strip():
            return str(delta_content).strip()
        return ""

    async def _try_model(
        self,
        client: httpx.AsyncClient,
        model: str,
        messages: list,
        max_tokens: int,
        headers: dict,
    ) -> tuple:
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": min(max_tokens, 4096),
            "temperature": 0.7,
        }
        try:
            resp = await asyncio.wait_for(
                client.post(self.base_url, json=payload, headers=headers),
                timeout=_PER_MODEL_TIMEOUT,
            )
            if resp.status_code in (429, 400, 404, 402, 403):
                return False, f"status {resp.status_code}", {}
            if resp.status_code != 200:
                return False, f"status {resp.status_code}", {}
            data = resp.json()
            return True, "", data
        except asyncio.TimeoutError:
            return False, "timeout", {}
        except httpx.TimeoutException:
            return False, "httpx timeout", {}
        except Exception as exc:
            return False, str(exc)[:80], {}

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> LLMResponse:
        start = time.perf_counter()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ashu-ai.vercel.app",
            "X-Title": "ASHU AI Assistant",
        }
        outer_timeout = httpx.Timeout(connect=10.0, read=60.0, write=10.0, pool=5.0)
        last_error = ""
        async with httpx.AsyncClient(timeout=outer_timeout) as client:
            for model in _OPENROUTER_FREE_MODELS:
                ok, err, data = await self._try_model(client, model, messages, max_tokens, headers)
                if not ok:
                    last_error = f"OpenRouter {model}: {err}"
                    continue
                content = self._extract_content(data)
                if not content:
                    last_error = f"OpenRouter {model}: empty content"
                    continue
                latency = (time.perf_counter() - start) * 1000
                tokens = data.get("usage", {}).get("total_tokens", 0)
                return LLMResponse(
                    content=content,
                    provider=self.provider_name,
                    model=model,
                    tokens_used=tokens,
                    latency_ms=latency,
                )
        raise ValueError(f"All OpenRouter free models failed. Last: {last_error}")
