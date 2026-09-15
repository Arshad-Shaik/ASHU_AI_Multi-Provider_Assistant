# backend/app/models/database.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MemoryEntryDB(BaseModel):
    id: str
    memory_id: str
    session_id: str
    user_prompt: str
    ai_response: str
    command_type: str
    provider_used: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    tags: Optional[list[str]] = None
    title: Optional[str] = None


class ConversationMessageDB(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    command_type: str
    memory_id: Optional[str] = None
    provider_used: Optional[str] = None
    timestamp: datetime


class ProviderLogDB(BaseModel):
    id: str
    session_id: str
    provider_name: str
    command_type: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: float
    success: bool
    error_message: Optional[str] = None
    created_at: datetime
