# backend/app/routers/auth.py
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.services.auth import SupabaseUser

router = APIRouter()


@router.get("/me")
async def get_current_user_info(current_user: SupabaseUser = Depends(get_current_user)):
    return {
        "authenticated": True,
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
    }