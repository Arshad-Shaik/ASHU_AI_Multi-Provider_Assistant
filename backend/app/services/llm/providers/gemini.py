# backend/app/services/llm/providers/gemini.py
import time
import asyncio
import httpx
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings

_GEMINI_MODELS = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite-preview",
]

_MIN_OUTPUT_TOKENS = 512


class GeminiProvider(BaseLLMProvider):
    provider_name = "gemini"
    model_name = "gemini-flash-latest"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def is_available(self) -> bool:
        return bool(self.api_key)

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _build_payload(self, prompt: str, system_prompt: str, max_tokens: int) -> dict:
        text = (system_prompt + "\n\n" + prompt).strip() if system_prompt else prompt
        return {
            "contents": [{"role": "user", "parts": [{"text": text}]}],
            "generationConfig": {
                "maxOutputTokens": max(max_tokens, _MIN_OUTPUT_TOKENS),
                "temperature": 0.7,
                "topP": 0.95,
            },
        }

    def _extract_text(self, data: dict) -> str:
        candidates = data.get("candidates", [])
        if not candidates:
            return ""
        candidate = candidates[0]
        finish_reason = candidate.get("finishReason", "")
        content = candidate.get("content", {})
        if not content:
            return ""
        parts = content.get("parts", [])
        if not parts:
            return ""
        text = "".join(p.get("text", "") for p in parts)
        if not text.strip() and finish_reason == "MAX_TOKENS":
            return ""
        return text

    async def _try_model(
        self,
        client: httpx.AsyncClient,
        model: str,
        payload: dict,
    ) -> tuple:
        url = f"{self.base_url}/{model}:generateContent?key={self.api_key}"
        try:
            resp = await asyncio.wait_for(
                client.post(url, json=payload),
                timeout=25.0,
            )
            if resp.status_code == 429:
                return False, f"rate limited (429)", {}
            if resp.status_code == 503:
                return False, f"overloaded (503)", {}
            if resp.status_code in (400, 404):
                return False, f"unavailable ({resp.status_code}): {resp.text[:60]}", {}
            if resp.status_code == 403:
                return False, f"quota exceeded (403)", {}
            if resp.status_code != 200:
                return False, f"status {resp.status_code}", {}
            return True, "", resp.json()
        except asyncio.TimeoutError:
            return False, "timeout >25s", {}
        except httpx.TimeoutException:
            return False, "httpx timeout", {}
        except Exception as exc:
            return False, str(exc)[:80], {}

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> LLMResponse:
        start = time.perf_counter()
        payload = self._build_payload(prompt, system_prompt, max_tokens)
        outer_timeout = httpx.Timeout(connect=10.0, read=35.0, write=10.0, pool=5.0)
        last_error = ""
        async with httpx.AsyncClient(timeout=outer_timeout) as client:
            for model in _GEMINI_MODELS:
                ok, err, data = await self._try_model(client, model, payload)
                if not ok:
                    last_error = f"Gemini {model}: {err}"
                    continue
                text = self._extract_text(data)
                if not text.strip():
                    last_error = f"Gemini {model}: empty response"
                    continue
                latency = (time.perf_counter() - start) * 1000
                tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
                return LLMResponse(
                    content=text,
                    provider=self.provider_name,
                    model=model,
                    tokens_used=tokens,
                    latency_ms=latency,
                )
        raise ValueError(f"All Gemini models failed. Last: {last_error}")
