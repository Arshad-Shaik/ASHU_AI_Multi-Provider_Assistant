# backend/app/core/config.py
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"

_MANDATORY_CORS_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

def _build_lan_origins(ports: list[int] | None = None) -> list[str]:
    import socket
    origins: list[str] = []
    _ports = ports or [3000, 3001]
    try:
        hostname = socket.gethostname()
        lan_ips = socket.getaddrinfo(hostname, None, socket.AF_INET)
        seen: set[str] = set()
        for info in lan_ips:
            ip = info[4][0]
            if ip not in seen and not ip.startswith("127."):
                seen.add(ip)
                for port in _ports:
                    origins.append(f"http://{ip}:{port}")
    except Exception:
        pass
    for subnet in ("192.168.", "10.", "172."):
        for port in _ports:
            wildcard = f"http://{subnet}"
            _ = wildcard
    return origins


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    APP_NAME: str = "ASHU_AI_Assistant"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = Field(
        default="development",
        validation_alias=AliasChoices("ENVIRONMENT", "APP_ENV"),
    )
    DEBUG: bool = True

    API_HOST: str = Field(
        default="0.0.0.0",
        validation_alias=AliasChoices("API_HOST", "APP_HOST"),
    )
    API_PORT: int = Field(
        default=8000,
        validation_alias=AliasChoices("API_PORT", "APP_PORT"),
    )

    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    FRONTEND_URL: str = "http://localhost:3000"
    FRONTEND_MOBILE_URL: str = ""

    ASHU_DEVELOPER_NAME: str = "AWS - | Arshad Wasib Shaik |"
    ASHU_DEVELOPER_LINKEDIN: str = ""
    ASHU_DEVELOPER_GITHUB: str = ""
    ASHU_DEVELOPER_PORTFOLIO: str = ""
    ASHU_AI_FULL_FORM: str = "AdvancedSystemHolographicUnified_Artificial_Intelligence_Assistant"

    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROK_API_KEY: str = ""
    MISTRAL_API_KEY: str = ""
    CLAUDE_API_KEY: str = Field(
        default="",
        validation_alias=AliasChoices("CLAUDE_API_KEY", "ANTHROPIC_API_KEY"),
    )
    CEREBRAS_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    COHERE_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""
    CLOUDFLARE_API_KEY: str = ""
    CLOUDFLARE_ACCOUNT_ID: str = ""
    TOGETHER_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    )
    SUPABASE_JWT_SECRET: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_JWT_SECRET", "JWT_SECRET"),
    )

    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        validation_alias=AliasChoices("CORS_ORIGINS", "ALLOWED_ORIGINS"),
    )
    CORS_EXTRA_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default=[],
        validation_alias=AliasChoices("CORS_EXTRA_ORIGINS", "EXTRA_ORIGINS"),
    )

    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 500

    CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = 5
    CIRCUIT_BREAKER_RECOVERY_TIMEOUT: int = 30
    CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS: int = 2
    MAX_RETRIES: int = 1
    REQUEST_TIMEOUT: int = 30
    PROVIDER_TIMEOUT_SECONDS: int = 25

    LLM_PROVIDER_ORDER: Annotated[list[str], NoDecode] = Field(
        default=[
            "gemini", "groq", "mistral", "openai", "grok",
            "claude", "cerebras", "openrouter", "cohere",
            "huggingface", "cloudflare", "together", "deepseek",
        ],
        validation_alias=AliasChoices("LLM_PROVIDER_ORDER", "PROVIDER_PRIORITY"),
    )

    @field_validator(
        "CORS_ORIGINS",
        "CORS_EXTRA_ORIGINS",
        "LLM_PROVIDER_ORDER",
        mode="before",
    )
    @classmethod
    def split_comma_separated(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def supabase_jwt_secret(self) -> str:
        return self.SUPABASE_JWT_SECRET

    def get_all_cors_origins(self) -> list[str]:
        combined: list[str] = list(_MANDATORY_CORS_ORIGINS)
        for lan_origin in _build_lan_origins():
            if lan_origin not in combined:
                combined.append(lan_origin)
        for origin in list(self.CORS_ORIGINS) + list(self.CORS_EXTRA_ORIGINS):
            if origin and origin not in combined:
                combined.append(origin)
        if self.FRONTEND_URL and self.FRONTEND_URL not in combined:
            combined.append(self.FRONTEND_URL)
        if self.FRONTEND_MOBILE_URL and self.FRONTEND_MOBILE_URL not in combined:
            combined.append(self.FRONTEND_MOBILE_URL)
        return combined

    def build_identity_context(self) -> str:
        parts = [
            "Your name is ASHU AI.",
            f"ASHU stands for: {self.ASHU_AI_FULL_FORM}.",
            f"You were developed by {self.ASHU_DEVELOPER_NAME}.",
        ]
        if self.ASHU_DEVELOPER_LINKEDIN:
            parts.append(f"Developer LinkedIn: {self.ASHU_DEVELOPER_LINKEDIN}")
        if self.ASHU_DEVELOPER_GITHUB:
            parts.append(f"Developer GitHub: {self.ASHU_DEVELOPER_GITHUB}")
        if self.ASHU_DEVELOPER_PORTFOLIO:
            parts.append(f"Developer Portfolio: {self.ASHU_DEVELOPER_PORTFOLIO}")
        parts.append(
            "When anyone asks who created you, who developed you, what is ASHU AI,"
            "or what does ASHU stand for ? always answer with this identity information. "
            "Never claim to be created by any AI company like Mistral, OpenAI, Google, or Anthropic. "
            "You are ASHU AI, developed by the developer mentioned above."
        )
        return " ".join(parts)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
