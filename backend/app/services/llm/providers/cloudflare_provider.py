# backend/app/services/llm/providers/cloudflare_provider.py
from app.services.llm.base import BaseLLMProvider, LLMResponse
from app.core.config import get_settings


class CloudflareProvider(BaseLLMProvider):
    provider_name = "cloudflare"
    model_name = "@cf/meta/llama-3.1-8b-instruct"

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.CLOUDFLARE_API_KEY
        self.account_id = self.settings.CLOUDFLARE_ACCOUNT_ID

    def is_available(self) -> bool:
        return False

    def is_configured(self) -> bool:
        return bool(self.api_key and self.account_id)

    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 2048) -> LLMResponse:
        raise ValueError("Cloudflare disabled: authentication error (401). Verify API token at dash.cloudflare.com")
