# backend/app/models/request.py
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


CommandType = Literal["@", "$", "#", "*", "\u2731", "default", "slash", "chat"]


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    session_id: str = Field(..., min_length=1, max_length=128)
    command_type: CommandType = Field(default="default")
    memory_id: Optional[str] = Field(default=None)
    conversation_id: Optional[str] = Field(default=None)
    instruction: Optional[str] = Field(default=None)

    @field_validator("prompt", mode="before")
    @classmethod
    def strip_prompt(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("session_id", mode="before")
    @classmethod
    def strip_session_id(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v


class SlashCommandRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=256)
    session_id: str = Field(default="anonymous", min_length=1, max_length=128)


class AtCommandRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    session_id: str = Field(..., min_length=1, max_length=128)

    @field_validator("prompt", mode="before")
    @classmethod
    def strip_prompt(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v


class DollarCommandRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=8000)
    session_id: str = Field(..., min_length=1, max_length=128)


class HashCommandRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    session_id: str = Field(..., min_length=1, max_length=128)

    @field_validator("prompt", mode="before")
    @classmethod
    def strip_prompt(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v


class StarCommandRequest(BaseModel):
    memory_id: str = Field(..., min_length=1, max_length=128)
    session_id: str = Field(..., min_length=1, max_length=128)
    instruction: Optional[str] = Field(default=None, max_length=2000)