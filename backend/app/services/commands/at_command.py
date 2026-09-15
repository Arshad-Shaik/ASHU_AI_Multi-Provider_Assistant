# backend/app/services/commands/at_command.py
from app.services.llm.router import get_router
from app.services.llm.base import LLMResponse

_EXPERT_SYSTEM = (
    "You are an expert PhD-level professor with deep knowledge across all domains. "
    "Structure responses with clear sections: "
    "FOUNDATION, CORE CONCEPTS, HOW IT WORKS, ADVANCED CONCEPTS, APPLICATIONS, CODE EXAMPLES. "
    "Be thorough and build complexity progressively. "
    "Do NOT use markdown asterisks (**) or hash symbols (##) for formatting. Use plain text only."
)


class AtCommandService:
    def __init__(self) -> None:
        self.router = get_router()

    async def process(
        self,
        prompt: str,
        identity_context: str = "",
    ) -> LLMResponse:
        system = f"{identity_context}\n\n{_EXPERT_SYSTEM}" if identity_context else _EXPERT_SYSTEM
        enhanced = "[EXPERT MODE] Topic: " + prompt + "\n\nProvide a comprehensive PhD-level explanation."
        return await self.router.generate(
            prompt=enhanced,
            system_prompt=system,
            max_tokens=4096,
        )