# backend/app/routers/commands.py
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from app.models.request import SlashCommandRequest, AtCommandRequest, DollarCommandRequest, HashCommandRequest, StarCommandRequest
from app.services.commands.at_command import AtCommandService
from app.services.commands.dollar_command import DollarCommandService
from app.services.commands.hash_command import HashCommandService
from app.services.commands.star_command import StarCommandService
from app.services.analytics.tracker import get_tracker
from app.services.memory.conversation import save_memory
from app.services.memory.conversation_logger import log_exchange
from app.services.llm.base import LLMResponse
from app.core.security import get_current_user
from app.services.auth import SupabaseUser
from app.core.config import get_settings

router = APIRouter()
_settings = get_settings()

_HELP_TEXT = (
    "@ <topic>     - Expert PhD-level explanation\n"
    "$ <code>      - Code analysis with line-by-line breakdown\n"
    "# <prompt>    - Save response to memory with unique ID\n"
    "* <memory_id> - Regenerate or extend a saved response\n"
    "\u2731 <memory_id>  - Same as * command\n"
    "/help         - Show this help message\n"
    "/clear        - Clear terminal\n"
    "/status       - Show provider status\n"
    "/providers    - List all AI providers\n"
    "/history      - Show conversation history\n"
    "/export       - Export chat history\n"
    "/theme        - Cycle terminal theme\n"
    "/version      - Show version info\n"
    "/login        - Sign in or create an account\n"
    "/logout       - Sign out"
)

SLASH_COMMANDS: dict[str, tuple[str, str]] = {
    "help": ("AVAILABLE COMMANDS", _HELP_TEXT),
    "clear": ("CLEAR", "CLEAR_TERMINAL"),
    "status": ("PROVIDER STATUS", "Use GET /api/v1/health/providers for live status"),
    "providers": ("PROVIDERS", ", ".join(_settings.LLM_PROVIDER_ORDER)),
    "history": ("HISTORY", "Conversation history is stored in the Memory Panel. Use # command to save entries."),
    "export": ("EXPORT", "EXPORT_CHAT"),
    "theme": ("THEME", "TOGGLE_THEME"),
    "version": ("VERSION", f"ASHU_AI_Assistant v{_settings.APP_VERSION} - Multi-provider AI Terminal"),
    "login": ("LOGIN", "LOGIN_REQUEST"),
    "logout": ("LOGOUT", "LOGOUT_REQUEST"),
}

_ACTION_KEYWORDS = frozenset({
    "CLEAR_TERMINAL",
    "EXPORT_CHAT",
    "TOGGLE_THEME",
    "LOGIN_REQUEST",
    "LOGOUT_REQUEST",
})


async def _persist_exchange(
    user_id: str,
    session_id: str,
    command_type: str,
    prompt: str,
    result: LLMResponse,
) -> Optional[str]:
    if result.error:
        return None
    memory_id: Optional[str] = None
    try:
        memory_entry = await save_memory(
            user_id=user_id,
            user_prompt=prompt,
            ai_response=result.content,
            command_type=command_type,
            provider_used=result.provider,
        )
        memory_id = memory_entry.memory_id
    except Exception:
        memory_id = None
    try:
        await log_exchange(
            user_id=user_id,
            session_id=session_id,
            command_type=command_type,
            provider=result.provider,
            user_prompt=prompt,
            ai_response=result.content,
            memory_id=memory_id,
            tokens_used=result.tokens_used,
            latency_ms=result.latency_ms,
        )
    except Exception:
        pass
    return memory_id


@router.post("/slash")
async def slash_command(request: SlashCommandRequest):
    parts = request.command.strip().lstrip("/").lower().split()
    if not parts:
        return {
            "command": "",
            "response": "Empty command. Type /help for available commands.",
            "success": False,
            "action": None,
        }
    cmd = parts[0]
    if cmd not in SLASH_COMMANDS:
        return {
            "command": cmd,
            "response": f"Unknown command: /{cmd}. Type /help for available commands.",
            "success": False,
            "action": None,
        }
    title, body = SLASH_COMMANDS[cmd]
    action: Optional[str] = None
    response_text: str = body
    if body in _ACTION_KEYWORDS:
        action = body
        response_text = f"Action triggered: {action}"
    return {
        "command": cmd,
        "response": response_text,
        "title": title,
        "success": True,
        "action": action,
    }


@router.post("/at")
async def at_command(
    request: AtCommandRequest,
    current_user: SupabaseUser = Depends(get_current_user),
):
    try:
        svc = AtCommandService()
        result = await svc.process(request.prompt)
        memory_id = await _persist_exchange(
            current_user.id, request.session_id, "@", request.prompt, result
        )
        tracker = get_tracker()
        tracker.track(
            session_id=request.session_id,
            command_type="@",
            provider=result.provider,
            tokens=result.tokens_used,
            latency_ms=result.latency_ms,
            user_id=current_user.id,
        )
        return {
            "response": result.content,
            "provider_used": result.provider,
            "command_type": "@",
            "memory_id": memory_id,
            "session_id": request.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dollar")
async def dollar_command(
    request: DollarCommandRequest,
    current_user: SupabaseUser = Depends(get_current_user),
):
    try:
        svc = DollarCommandService()
        result = await svc.process(request.code)
        memory_id = await _persist_exchange(
            current_user.id, request.session_id, "$", request.code, result
        )
        tracker = get_tracker()
        tracker.track(
            session_id=request.session_id,
            command_type="$",
            provider=result.provider,
            tokens=result.tokens_used,
            latency_ms=result.latency_ms,
            user_id=current_user.id,
        )
        return {
            "response": result.content,
            "provider_used": result.provider,
            "command_type": "$",
            "memory_id": memory_id,
            "session_id": request.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hash")
async def hash_command(
    request: HashCommandRequest,
    current_user: SupabaseUser = Depends(get_current_user),
):
    try:
        svc = HashCommandService()
        result = await svc.process(request.prompt)
        memory_id = await _persist_exchange(
            current_user.id, request.session_id, "#", request.prompt, result
        )
        tracker = get_tracker()
        tracker.track(
            session_id=request.session_id,
            command_type="#",
            provider=result.provider,
            tokens=result.tokens_used,
            latency_ms=result.latency_ms,
            user_id=current_user.id,
        )
        return {
            "response": result.content,
            "provider_used": result.provider,
            "command_type": "#",
            "memory_id": memory_id,
            "session_id": request.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/star")
async def star_command(
    request: StarCommandRequest,
    current_user: SupabaseUser = Depends(get_current_user),
):
    try:
        svc = StarCommandService()
        result = await svc.process(
            request.memory_id, request.instruction, current_user.id
        )
        memory_id = await _persist_exchange(
            current_user.id, request.session_id, "*", request.memory_id, result
        )
        tracker = get_tracker()
        tracker.track(
            session_id=request.session_id,
            command_type="*",
            provider=result.provider,
            tokens=result.tokens_used,
            latency_ms=result.latency_ms,
            user_id=current_user.id,
        )
        return {
            "response": result.content,
            "provider_used": result.provider,
            "command_type": "*",
            "memory_id": memory_id,
            "session_id": request.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))