# backend/app/services/llm/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class LLMResponse:
    content: str
    provider: str
    model: str
    tokens_used: Optional[int] = None
    latency_ms: Optional[float] = None
    error: Optional[str] = None


class BaseLLMProvider(ABC):
    provider_name: str = "base"
    model_name: str = "unknown"

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 4096) -> LLMResponse:
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        pass
