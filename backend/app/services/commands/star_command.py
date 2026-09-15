# backend/app/services/commands/star_command.py
from typing import Optional
from app.services.llm.router import get_router
from app.services.llm.base import LLMResponse
from app.services.memory.conversation import get_memory

_REGEN_SYSTEM = (
    "You are an expert AI specializing in regenerating and enhancing previous responses. "
    "Improve clarity, depth, add examples, correct issues, extend with insights. "
    "Do NOT use markdown asterisks (**) or hash symbols (##). Use plain text only."
)

_NOT_FOUND_MSG = (
    "Memory ID not found. "
    "Use the # command to save a response to memory first, "
    "then use * with the generated memory ID."
)


class StarCommandService:
    def __init__(self) -> None:
        self.router = get_router()

    async def process(
        self,
        memory_id: str,
        instruction: Optional[str] = None,
        user_id: str = "",
        identity_context: str = "",
    ) -> LLMResponse:
        entry = await get_memory(memory_id, user_id)
        if not entry:
            return LLMResponse(
                content=_NOT_FOUND_MSG + " Requested ID: " + memory_id,
                provider="none",
                model="none",
                error="Memory not found",
            )
        system = f"{identity_context}\n\n{_REGEN_SYSTEM}" if identity_context else _REGEN_SYSTEM
        instr = instruction or "Regenerate and enhance with more depth and examples."
        enhanced = (
            "[REGENERATE MODE]\n"
            "Original Prompt: " + entry.user_prompt + "\n"
            "Original Response: " + entry.ai_response[:2000] + "\n"
            "Instruction: " + instr + "\n"
            "Provide an improved and enhanced version."
        )
        return await self.router.generate(
            prompt=enhanced,
            system_prompt=system,
            max_tokens=4096,
        )