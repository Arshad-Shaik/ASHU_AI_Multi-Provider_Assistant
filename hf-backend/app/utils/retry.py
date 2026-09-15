# backend/app/utils/retry.py
import asyncio
import functools
from typing import Callable, TypeVar, Any

T = TypeVar("T")


async def retry_async(func: Callable, max_retries: int = 2, delay: float = 0.5) -> Any:
    last_error: Exception = Exception("Unknown error")
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                await asyncio.sleep(delay * (attempt + 1))
    raise last_error
