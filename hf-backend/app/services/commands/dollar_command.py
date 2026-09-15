# backend/app/services/commands/dollar_command.py
from app.services.llm.router import get_router
from app.services.llm.base import LLMResponse

_CODE_SYSTEM = (
    "You are an expert senior software engineer and code analyst. "
    "Analyze code with these sections: "
    "LANGUAGE DETECTION, LINE BY LINE ANALYSIS, ISSUES FOUND, VERSION COMPATIBILITY, "
    "IMPROVED VERSION, BEST PRACTICES. "
    "Be precise and technical. "
    "Do NOT use markdown asterisks (**) or hash symbols (##). Use plain text only."
)


class DollarCommandService:
    def __init__(self) -> None:
        self.router = get_router()

    async def process(
        self,
        code: str,
        identity_context: str = "",
    ) -> LLMResponse:
        system = f"{identity_context}\n\n{_CODE_SYSTEM}" if identity_context else _CODE_SYSTEM
        enhanced = "[CODE ANALYSIS]\nCode:\n" + code + "\n\nProvide complete line-by-line analysis."
        return await self.router.generate(
            prompt=enhanced,
            system_prompt=system,
            max_tokens=4096,
        )