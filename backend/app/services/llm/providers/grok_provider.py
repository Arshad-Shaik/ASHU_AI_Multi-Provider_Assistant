# backend/app/services/llm/providers/grok_provider.py
import time
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings


class GrokProvider(BaseLLMProvider):
    provider_name = "grok"
    model_name = "grok-beta"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.GROK_API_KEY

    def is_available(self) -> bool:
        return False

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> LLMResponse:
        raise ValueError("Grok provider disabled: account has no credits. Add credits at console.x.ai")
