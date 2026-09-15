# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.routers.health import router as health_router
from app.routers.chat import router as chat_router
from app.routers.commands import router as commands_router
from app.routers.memory import router as memory_router
from app.routers.analytics import router as analytics_router
from app.routers.auth import router as auth_router

__all__ = ["app"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    from app.services.llm.router import get_router
    llm_router = get_router()
    providers = llm_router.get_available_providers()
    active = [
        p["name"]
        for p in providers
        if p.get("available", False)
    ]
    print(f"ASHU AI Assistant v{settings.APP_VERSION} starting...")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Active providers ({len(active)}): {active if active else 'None configured'}")
    print(f"CORS origins: {settings.get_all_cors_origins()}")
    print(f"Provider timeout: {settings.PROVIDER_TIMEOUT_SECONDS}s")
    yield
    print("ASHU AI Assistant shutting down...")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )
    _cors_origins = settings.get_all_cors_origins()
    _allow_all = settings.ENVIRONMENT == "development"
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if _allow_all else _cors_origins,
        allow_credentials=False if _allow_all else True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.include_router(health_router, prefix="/api/v1/health", tags=["health"])
    app.include_router(chat_router, prefix="/api/v1/chat", tags=["chat"])
    app.include_router(commands_router, prefix="/api/v1/commands", tags=["commands"])
    app.include_router(memory_router, prefix="/api/v1/memory", tags=["memory"])
    app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
    return app


app = create_app()
