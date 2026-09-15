# backend/app/routers/memory.py
from fastapi import APIRouter, HTTPException, Depends
from app.services.memory.conversation import get_memory, get_user_memories, delete_memory, MemoryStoreError
from app.core.security import get_current_user, is_valid_memory_id
from app.services.auth import SupabaseUser

router = APIRouter()


@router.get("")
@router.get("/", include_in_schema=False)
async def list_memories(current_user: SupabaseUser = Depends(get_current_user)):
    try:
        entries = await get_user_memories(current_user.id)
    except MemoryStoreError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return [e.to_dict() for e in entries]


@router.get("/{memory_id}")
async def get_memory_entry(memory_id: str, current_user: SupabaseUser = Depends(get_current_user)):
    if not is_valid_memory_id(memory_id):
        raise HTTPException(status_code=400, detail="Invalid memory ID format")
    try:
        entry = await get_memory(memory_id, current_user.id)
    except MemoryStoreError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not entry:
        raise HTTPException(status_code=404, detail="Memory entry not found")
    return entry.to_dict()


@router.delete("/{memory_id}")
async def delete_memory_entry(memory_id: str, current_user: SupabaseUser = Depends(get_current_user)):
    if not is_valid_memory_id(memory_id):
        raise HTTPException(status_code=400, detail="Invalid memory ID format")
    try:
        success = await delete_memory(memory_id, current_user.id)
    except MemoryStoreError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not success:
        raise HTTPException(status_code=404, detail="Memory entry not found")
    return {"success": True, "memory_id": memory_id}