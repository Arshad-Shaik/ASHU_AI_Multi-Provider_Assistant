# backend/app/services/llm/providers/deepseek_provider.py
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings


class DeepSeekProvider(BaseLLMProvider):
    provider_name = "deepseek"
    model_name = "deepseek-v4-flash"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.DEEPSEEK_API_KEY

    def is_available(self) -> bool:
        return False

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> LLMResponse:
        raise ValueError("DeepSeek disabled: insufficient balance (402). Top up at platform.deepseek.com")
