# backend/app/services/llm/providers/claude_provider.py
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings


class ClaudeProvider(BaseLLMProvider):
    provider_name = "claude"
    model_name = "claude-haiku-4-5-20251001"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.CLAUDE_API_KEY

    def is_available(self) -> bool:
        return False

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> LLMResponse:
        raise ValueError("Claude disabled: credit balance too low (400). Add credits at console.anthropic.com")
