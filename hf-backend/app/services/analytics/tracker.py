# backend/app/services/analytics/tracker.py
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from typing import Optional
import httpx
from app.core.config import get_settings

logger = logging.getLogger("ashu.analytics")

_PERIOD_DAYS: dict[str, int] = {
    "1d": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
}


def _period_to_cutoff(period: str) -> datetime:
    days = _PERIOD_DAYS.get(period, 7)
    return datetime.now(timezone.utc) - timedelta(days=days)


class AnalyticsTracker:
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.SUPABASE_URL.rstrip("/")
        self.service_key = self.settings.SUPABASE_SERVICE_KEY
        self._local_cache: list[dict] = []

    def is_configured(self) -> bool:
        return bool(self.base_url and self.service_key)

    def get_total_request_count(self) -> int:
        return len(self._local_cache)

    def _headers(self) -> dict:
        return {
            "apikey": self.service_key,
            "Authorization": "Bearer " + self.service_key,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    def track(
        self,
        session_id: str,
        command_type: str,
        provider: str,
        tokens: Optional[int],
        latency_ms: Optional[float],
        success: bool = True,
        user_id: Optional[str] = None,
    ) -> None:
        record = {
            "user_id": user_id,
            "session_id": session_id,
            "command_type": command_type,
            "provider": provider,
            "tokens": tokens or 0,
            "latency_ms": latency_ms or 0.0,
            "success": success,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._local_cache = (self._local_cache + [record])[-1000:]

        if not user_id or not self.is_configured():
            return

        payload = {
            "user_id": user_id,
            "session_id": session_id,
            "command_type": command_type,
            "event_type": "chat",
            "action": command_type,
            "provider_used": provider,
            "tokens_used": tokens or 0,
            "response_time_ms": int(latency_ms or 0),
            "fallback_triggered": False,
            "content_length": 0,
        }
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(self._persist(payload))
        except RuntimeError:
            logger.warning("No running event loop; skipping analytics persistence")

    async def _persist(self, payload: dict) -> None:
        url = self.base_url + "/rest/v1/user_analytics"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(url, json=payload, headers=self._headers())
                resp.raise_for_status()
        except Exception as exc:
            logger.warning("Analytics persistence failed: %s", exc)

    def _local_summary(self, user_id: str, period: str) -> dict:
        cutoff = _period_to_cutoff(period)
        rows = [
            r for r in self._local_cache
            if r.get("user_id") == user_id and datetime.fromisoformat(r["timestamp"]) >= cutoff
        ]
        total = len(rows)
        total_tokens = sum(r["tokens"] for r in rows)
        latencies = [r["latency_ms"] for r in rows if r["latency_ms"] > 0]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
        provider_breakdown: dict[str, int] = defaultdict(int)
        command_breakdown: dict[str, int] = defaultdict(int)
        for r in rows:
            provider_breakdown[r["provider"]] += 1
            command_breakdown[r["command_type"]] += 1
        return {
            "total_requests": total,
            "total_tokens": total_tokens,
            "provider_breakdown": dict(provider_breakdown),
            "command_breakdown": dict(command_breakdown),
            "average_latency_ms": avg_latency,
            "period": period,
        }

    async def get_summary(self, user_id: str, period: str = "7d") -> dict:
        if not self.is_configured():
            return self._local_summary(user_id, period)

        cutoff = _period_to_cutoff(period)
        url = self.base_url + "/rest/v1/user_analytics"
        params = {
            "user_id": "eq." + user_id,
            "created_at": "gte." + cutoff.isoformat(),
            "select": "provider_used,command_type,tokens_used,response_time_ms",
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url, params=params, headers=self._headers())
                resp.raise_for_status()
                rows = resp.json()
        except Exception as exc:
            logger.warning("Analytics query failed, falling back to local cache: %s", exc)
            return self._local_summary(user_id, period)

        total = len(rows)
        total_tokens = sum(r.get("tokens_used", 0) or 0 for r in rows)
        latencies = [r.get("response_time_ms", 0) or 0 for r in rows if r.get("response_time_ms", 0)]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
        provider_breakdown: dict[str, int] = defaultdict(int)
        command_breakdown: dict[str, int] = defaultdict(int)
        for r in rows:
            provider_breakdown[r.get("provider_used", "unknown")] += 1
            command_breakdown[r.get("command_type", "default")] += 1
        return {
            "total_requests": total,
            "total_tokens": total_tokens,
            "provider_breakdown": dict(provider_breakdown),
            "command_breakdown": dict(command_breakdown),
            "average_latency_ms": avg_latency,
            "period": period,
        }


_tracker_instance: Optional[AnalyticsTracker] = None


def get_tracker() -> AnalyticsTracker:
    global _tracker_instance
    if _tracker_instance is None:
        _tracker_instance = AnalyticsTracker()
    return _tracker_instance