# backend/app/routers/health.py
import time
from datetime import datetime, timezone
from fastapi import APIRouter
from app.services.llm.router import get_router
from app.core.config import get_settings

router = APIRouter()
_start_time = time.time()


@router.get("")
@router.get("/", include_in_schema=False)
async def health_check():
    settings = get_settings()
    router_instance = get_router()
    providers = router_instance.get_available_providers()
    active = [p["name"] for p in providers if p.get("available", False)]
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": round(time.time() - _start_time, 2),
        "active_providers": active,
        "providers": {
            p["name"]: {
                "available": p.get("available", False),
                "model": p.get("model", ""),
                "configured": p.get("configured", False),
                "backed_off": p.get("backed_off", False),
                "latency_ms": None,
                "is_available": p.get("available", False),
            }
            for p in providers
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/providers")
async def provider_status():
    router_instance = get_router()
    providers = router_instance.get_available_providers()
    return [
        {
            "name": p["name"],
            "model": p.get("model", ""),
            "available": p.get("available", False),
            "configured": p.get("configured", False),
            "backed_off": p.get("backed_off", False),
            "is_available": p.get("available", False),
            "provider_name": p["name"],
            "model_name": p.get("model", ""),
        }
        for p in providers
    ]
