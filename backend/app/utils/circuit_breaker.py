# backend/app/utils/circuit_breaker.py
import time
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional


class CircuitState(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreaker:
    name: str
    failure_threshold: int = 3
    recovery_timeout: int = 60
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    last_failure_time: Optional[float] = None
    total_requests: int = 0
    total_failures: int = 0
    total_latency_ms: float = 0.0

    def can_attempt(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            if self.last_failure_time and (time.time() - self.last_failure_time) >= self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        return True

    def record_success(self, latency_ms: float = 0.0) -> None:
        self.total_requests += 1
        self.total_latency_ms += latency_ms
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def record_failure(self) -> None:
        self.total_requests += 1
        self.total_failures += 1
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

    @property
    def average_latency_ms(self) -> float:
        successful = self.total_requests - self.total_failures
        if successful <= 0:
            return 0.0
        return self.total_latency_ms / successful

    def to_dict(self) -> dict:
        return {
            "provider_name": self.name,
            "is_available": self.can_attempt(),
            "circuit_state": self.state.value,
            "failure_count": self.failure_count,
            "last_failure_time": str(self.last_failure_time) if self.last_failure_time else None,
            "recovery_time": str(self.last_failure_time + self.recovery_timeout) if self.last_failure_time else None,
            "total_requests": self.total_requests,
            "total_failures": self.total_failures,
            "average_latency_ms": self.average_latency_ms,
        }
