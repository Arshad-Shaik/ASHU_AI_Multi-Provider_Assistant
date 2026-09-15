# backend/app/services/llm/providers/cohere_provider.py
import time
import httpx
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings

_COHERE_MODELS = [
    "command-r7b-12-2024",
    "command-r-08-2024",
    "command-r-plus-08-2024",
    "command-a-03-2025",
]


class CohereProvider(BaseLLMProvider):
    provider_name = "cohere"
    model_name = "command-r7b-12-2024"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.COHERE_API_KEY
        self.base_url = "https://api.cohere.com/v2/chat"

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
            for model in _COHERE_MODELS:
                payload = {
                    "model": model,
                    "messages": messages,
                    "max_tokens": min(max_tokens, 4096),
                    "temperature": 0.7,
                }
                try:
                    resp = await client.post(self.base_url, json=payload, headers=headers)
                    if resp.status_code == 429:
                        last_error = f"Cohere {model} rate limited (429)"
                        continue
                    if resp.status_code in (400, 404):
                        last_error = f"Cohere {model} unavailable ({resp.status_code}): {resp.text[:80]}"
                        continue
                    if resp.status_code == 401:
                        last_error = f"Cohere {model} API key invalid (401)"
                        break
                    resp.raise_for_status()
                    data = resp.json()
                    content_blocks = data.get("message", {}).get("content", [])
                    content = content_blocks[0].get("text", "") if content_blocks else ""
                    if not content.strip():
                        last_error = f"Cohere {model} empty response"
                        continue
                    latency = (time.perf_counter() - start) * 1000
                    tokens_info = data.get("usage", {}).get("tokens", {})
                    tokens = tokens_info.get("input_tokens", 0) + tokens_info.get("output_tokens", 0)
                    return LLMResponse(
                        content=content,
                        provider=self.provider_name,
                        model=model,
                        tokens_used=tokens,
                        latency_ms=latency,
                    )
                except httpx.TimeoutException:
                    last_error = f"Cohere {model} timed out"
                    continue
                except Exception as exc:
                    last_error = f"Cohere {model} error: {exc}"
                    continue
        raise ValueError(f"All Cohere models failed. Last: {last_error}")
