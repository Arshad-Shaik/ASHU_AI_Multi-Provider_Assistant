# backend/app/routers/chat.py
from datetime import datetime, timezone
import logging
from fastapi import APIRouter, HTTPException, Depends
from app.models.request import ChatRequest
from app.models.response import ChatResponse
from app.services.llm.router import get_router
from app.services.commands.at_command import AtCommandService
from app.services.commands.dollar_command import DollarCommandService
from app.services.commands.hash_command import HashCommandService
from app.services.commands.star_command import StarCommandService
from app.services.analytics.tracker import get_tracker
from app.services.memory.conversation import save_memory
from app.services.memory.conversation_logger import log_exchange
from app.utils.command_types import normalize_command_type
from app.core.security import sanitize_input, get_current_user
from app.core.config import get_settings
from app.services.auth import SupabaseUser

logger = logging.getLogger(__name__)
router = APIRouter()

_BASE_SYSTEM_PROMPT = (
    "You are ASHU AI, a professional AI assistant. "
    "Provide clear, accurate, and helpful responses. "
    "Do NOT use markdown asterisks (**) or hash symbols (##) for formatting. "
    "Use plain text with clear structure using labels and line breaks only."
    "Never claim to be created by Mistral, OpenAI, Google, Anthropic, or any other AI company."
)


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: SupabaseUser = Depends(get_current_user),
) -> ChatResponse:
    prompt = sanitize_input(request.prompt)
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    cmd = request.command_type
    tracker = get_tracker()
    settings = get_settings()
    identity_ctx = settings.build_identity_context()
    base_system = f"{identity_ctx}\n\n{_BASE_SYSTEM_PROMPT}"

    try:
        if cmd == "@":
            svc = AtCommandService()
            result = await svc.process(prompt, identity_context=identity_ctx)
        elif cmd == "$":
            svc = DollarCommandService()
            result = await svc.process(prompt, identity_context=identity_ctx)
        elif cmd == "#":
            svc = HashCommandService()
            result = await svc.process(prompt)
        elif cmd in ("*", "\u2731"):
            svc = StarCommandService()
            mid = request.memory_id or prompt.strip().split()[-1]
            result = await svc.process(mid, request.instruction, current_user.id)
        else:
            llm = get_router()
            result = await llm.generate(
                prompt=prompt,
                system_prompt=base_system,
            )
    except Exception as e:
        tracker.track(
            session_id=request.session_id,
            command_type=cmd,
            provider="none",
            tokens=None,
            latency_ms=None,
            success=False,
            user_id=current_user.id,
        )
        raise HTTPException(status_code=500, detail=str(e))

    memory_command_type = normalize_command_type(cmd)
    memory_id = None

    if not result.error:
        try:
            memory_entry = await save_memory(
                user_id=current_user.id,
                user_prompt=prompt,
                ai_response=result.content,
                command_type=memory_command_type,
                provider_used=result.provider,
            )
            memory_id = memory_entry.memory_id
        except Exception as mem_exc:
            logger.warning("Memory save failed (non-fatal): %s", mem_exc)
            memory_id = None

        try:
            await log_exchange(
                user_id=current_user.id,
                session_id=request.session_id,
                command_type=memory_command_type,
                provider=result.provider,
                user_prompt=prompt,
                ai_response=result.content,
                memory_id=memory_id,
                tokens_used=result.tokens_used,
                latency_ms=result.latency_ms,
            )
        except Exception as log_exc:
            logger.warning("Conversation log failed (non-fatal): %s", log_exc)

    tracker.track(
        session_id=request.session_id,
        command_type=cmd,
        provider=result.provider,
        tokens=result.tokens_used,
        latency_ms=result.latency_ms,
        success=True,
        user_id=current_user.id,
    )

    return ChatResponse(
        response=result.content,
        provider_used=result.provider,
        command_type=cmd,
        memory_id=memory_id,
        session_id=request.session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        tokens_used=result.tokens_used,
        latency_ms=result.latency_ms,
    )