# backend/app/services/llm/providers/openai_provider.py
import time
import httpx
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings

_OPENAI_MODELS = [
    "gpt-4o-mini",
    "gpt-3.5-turbo",
]


class OpenAIProvider(BaseLLMProvider):
    provider_name = "openai"
    model_name = "gpt-4o-mini"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.OPENAI_API_KEY
        self.base_url = "https://api.openai.com/v1/chat/completions"

    def is_available(self) -> bool:
        return bool(self.api_key)

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> LLMResponse:
        start = time.perf_counter()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        timeout = httpx.Timeout(connect=8.0, read=25.0, write=8.0, pool=5.0)
        last_error = ""
        async with httpx.AsyncClient(timeout=timeout) as client:
            for model in _OPENAI_MODELS:
                payload = {
                    "model": model,
                    "messages": messages,
                    "max_tokens": min(max_tokens, 4096),
                    "temperature": 0.7,
                }
                try:
                    resp = await client.post(self.base_url, json=payload, headers=headers)
                    if resp.status_code == 429:
                        last_error = f"OpenAI {model} rate limited (429)"
                        continue
                    if resp.status_code in (400, 404):
                        last_error = f"OpenAI {model} unavailable ({resp.status_code}): {resp.text[:80]}"
                        continue
                    if resp.status_code == 401:
                        last_error = f"OpenAI {model} API key invalid (401)"
                        break
                    resp.raise_for_status()
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    if not content.strip():
                        last_error = f"OpenAI {model} empty"
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
                except httpx.TimeoutException:
                    last_error = f"OpenAI {model} timed out"
                    continue
                except Exception as exc:
                    last_error = f"OpenAI {model} error: {exc}"
                    continue
        raise ValueError(f"All OpenAI models failed. Last: {last_error}")
