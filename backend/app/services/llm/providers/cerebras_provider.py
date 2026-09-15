# backend/app/services/llm/providers/cerebras_provider.py
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings


class CerebrasProvider(BaseLLMProvider):
    provider_name = "cerebras"
    model_name = "qwen-3.8-27b"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.CEREBRAS_API_KEY

    def is_available(self) -> bool:
        return False

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> LLMResponse:
        raise ValueError("Cerebras disabled: free quota exhausted (402). Add billing at cloud.cerebras.ai")
