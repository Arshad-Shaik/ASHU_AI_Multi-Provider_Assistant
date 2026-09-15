# backend/app/core/limiter.py
from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque

from fastapi import HTTPException
from app.core.config import settings


class RateLimiter:
    def __init__(self) -> None:
        self._ip_windows: dict[str, deque[float]] = defaultdict(deque)
        self._user_windows: dict[str, deque[float]] = defaultdict(deque)
        self._ip_hour_windows: dict[str, deque[float]] = defaultdict(deque)
        self._user_hour_windows: dict[str, deque[float]] = defaultdict(deque)
        self._lock: asyncio.Lock = asyncio.Lock()

    def _clean_window(self, window: deque[float], cutoff: float) -> None:
        while window and window[0] < cutoff:
            window.popleft()

    async def check(self, ip: str, user_id: str | None) -> None:
        now = time.monotonic()
        minute_cutoff = now - 60.0
        hour_cutoff = now - 3600.0
        per_minute = settings.RATE_LIMIT_PER_MINUTE
        per_hour = settings.RATE_LIMIT_PER_HOUR

        async with self._lock:
            ip_key = ip or "unknown"
            ip_min = self._ip_windows[ip_key]
            self._clean_window(ip_min, minute_cutoff)
            if len(ip_min) >= per_minute:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limit_exceeded",
                        "message": f"Too many requests. Limit is {per_minute} per minute.",
                        "retry_after_seconds": 60,
                    },
                )
            ip_hour = self._ip_hour_windows[ip_key]
            self._clean_window(ip_hour, hour_cutoff)
            if len(ip_hour) >= per_hour:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limit_exceeded",
                        "message": f"Hourly limit reached. Limit is {per_hour} per hour.",
                        "retry_after_seconds": 3600,
                    },
                )
            ip_min.append(now)
            ip_hour.append(now)

            if user_id:
                user_min = self._user_windows[user_id]
                self._clean_window(user_min, minute_cutoff)
                if len(user_min) >= per_minute:
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "error": "rate_limit_exceeded",
                            "message": f"Too many requests. Limit is {per_minute} per minute.",
                            "retry_after_seconds": 60,
                        },
                    )
                user_hour = self._user_hour_windows[user_id]
                self._clean_window(user_hour, hour_cutoff)
                if len(user_hour) >= per_hour:
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "error": "rate_limit_exceeded",
                            "message": f"Hourly limit reached. Limit is {per_hour} per hour.",
                            "retry_after_seconds": 3600,
                        },
                    )
                user_min.append(now)
                user_hour.append(now)