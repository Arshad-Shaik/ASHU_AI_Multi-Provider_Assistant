# backend/app/services/llm/providers/huggingface_provider.py
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings


class HuggingFaceProvider(BaseLLMProvider):
    provider_name = "huggingface"
    model_name = "meta-llama/Llama-3.2-3B-Instruct"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.HUGGINGFACE_API_KEY

    def is_available(self) -> bool:
        return False

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 2048) -> LLMResponse:
        raise ValueError("HuggingFace disabled: ISP blocks api-inference subdomain + token auth failed.")
