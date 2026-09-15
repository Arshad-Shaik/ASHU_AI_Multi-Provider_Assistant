# backend/app/models/response.py
from pydantic import BaseModel
from typing import Optional, Any


class ChatResponse(BaseModel):
    response: str
    provider_used: str
    command_type: str
    memory_id: Optional[str] = None
    session_id: str
    timestamp: str
    tokens_used: Optional[int] = None
    latency_ms: Optional[float] = None


class SlashCommandResponse(BaseModel):
    command: str
    response: str
    title: Optional[str] = None
    success: bool
    action: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    uptime_seconds: float
    active_providers: list[str]
    total_requests_served: int
    timestamp: str


class ProviderStatusResponse(BaseModel):
    provider_name: str
    is_available: bool
    circuit_state: str
    failure_count: int
    last_failure_time: Optional[str] = None
    recovery_time: Optional[str] = None
    total_requests: int
    total_failures: int
    average_latency_ms: float


class MemoryEntryResponse(BaseModel):
    id: str
    memory_id: str
    session_id: str
    user_prompt: str
    ai_response: str
    command_type: str
    provider_used: str
    created_at: str
    updated_at: Optional[str] = None
    tags: Optional[list[str]] = None
    title: Optional[str] = None


class AnalyticsResponse(BaseModel):
    total_requests: int
    total_tokens: int
    provider_breakdown: dict[str, int]
    command_breakdown: dict[str, int]
    average_latency_ms: float
    period: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[Any] = None
    status_code: int
