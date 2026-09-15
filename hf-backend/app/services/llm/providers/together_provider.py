# backend/app/services/llm/providers/together_provider.py
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings


class TogetherProvider(BaseLLMProvider):
    provider_name = "together"
    model_name = "meta-llama/Llama-3.3-70B-Instruct-Turbo"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.TOGETHER_API_KEY

    def is_available(self) -> bool:
        return False

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> LLMResponse:
        raise ValueError("Together disabled: credit limit exceeded (402). Add credits at api.together.ai")
