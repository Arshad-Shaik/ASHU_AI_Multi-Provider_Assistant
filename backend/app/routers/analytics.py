# backend/app/routers/analytics.py
from fastapi import APIRouter, Depends, Query
from app.models.response import AnalyticsResponse
from app.services.analytics.tracker import get_tracker
from app.core.security import get_current_user
from app.services.auth import SupabaseUser

router = APIRouter()

_VALID_PERIODS = {"1d", "7d", "30d", "90d"}


@router.get("", response_model=AnalyticsResponse)
@router.get("/", response_model=AnalyticsResponse, include_in_schema=False)
async def get_analytics(
    period: str = Query(default="7d"),
    current_user: SupabaseUser = Depends(get_current_user),
):
    normalized_period = period if period in _VALID_PERIODS else "7d"
    tracker = get_tracker()
    summary = await tracker.get_summary(user_id=current_user.id, period=normalized_period)
    return AnalyticsResponse(**summary)