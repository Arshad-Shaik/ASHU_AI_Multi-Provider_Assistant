# backend/app/services/commands/hash_command.py
from app.services.llm.router import get_router
from app.services.llm.base import LLMResponse

SYSTEM_PROMPT = (
    "You are a helpful AI assistant. Provide clear, accurate, and comprehensive responses. "
    "This response will be saved to memory. Make it thorough and well-structured. "
    "Do NOT use markdown ** or ## symbols. Use plain text with clear sections."
)


class HashCommandService:
    def __init__(self):
        self.router = get_router()

    async def process(self, prompt: str) -> LLMResponse:
        return await self.router.generate(
            prompt=prompt,
            system_prompt=SYSTEM_PROMPT,
            max_tokens=4096,
        )