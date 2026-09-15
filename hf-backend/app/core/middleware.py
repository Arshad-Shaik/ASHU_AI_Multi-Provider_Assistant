# backend/app/core/middleware.py
from __future__ import annotations

import time
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://0.0.0.0:3000",
    "http://0.0.0.0:8000",
    "http://192.168.1.56:3000",
    "http://192.168.1.56:8000",
    "http://192.168.1.56:3001",
    "https://localhost:3000",
    "https://localhost:8000",
]

ALLOWED_ORIGIN_PATTERNS: list[str] = [
    r"http://192\.168\.\d+\.\d+:\d+",
    r"http://10\.\d+\.\d+\.\d+:\d+",
    r"http://172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+",
    r"https://.*\.vercel\.app",
    r"https://.*\.hf\.space",
    r"https://.*\.huggingface\.co",
]


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: object) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()
        response: Response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{elapsed:.2f}ms"
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: object) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: object) -> None:
        super().__init__(app)
        import re
        self._patterns = [re.compile(p) for p in ALLOWED_ORIGIN_PATTERNS]

    def _is_allowed_origin(self, origin: str) -> bool:
        if origin in ALLOWED_ORIGINS:
            return True
        for pattern in self._patterns:
            if pattern.match(origin):
                return True
        return False

    async def dispatch(self, request: Request, call_next: object) -> Response:
        origin = request.headers.get("origin", "")
        if request.method == "OPTIONS":
            if self._is_allowed_origin(origin):
                response = Response(status_code=204)
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Request-ID, X-Session-ID"
                response.headers["Access-Control-Max-Age"] = "86400"
                return response
        response: Response = await call_next(request)
        if origin and self._is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Request-ID, X-Session-ID"
        return response


def register_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_origin_regex=r"(http://192\.168\.\d+\.\d+:\d+|http://10\.\d+\.\d+\.\d+:\d+|https://.*\.vercel\.app|https://.*\.hf\.space|https://.*\.huggingface\.co)",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID", "X-Session-ID"],
        max_age=86400,
    )


def register_middlewares(app: FastAPI) -> None:
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)