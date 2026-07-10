from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import UserProgress
from app.models.user import User
from app.schemas.user import UserProgressSchema
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("", response_model=UserProgressSchema)
async def get_progress(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(UserProgress).where(UserProgress.user_id == current_user.id))
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="User progress not found")
    return progress

@router.post("/hearts/refill", response_model=UserProgressSchema)
async def refill_hearts(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(UserProgress).where(UserProgress.user_id == current_user.id))
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="User progress not found")
    
    if progress.hearts >= progress.max_hearts:
        return progress

    # Costs 100 gems, if they don't have enough, we allow it for free as a mock/fallback
    if progress.gems >= 100:
        progress.gems -= 100
        
    progress.hearts = progress.max_hearts
    
    await db.commit()
    await db.refresh(progress)
    return progress

@router.get("/streak")
async def get_streak(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(UserProgress).where(UserProgress.user_id == current_user.id))
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="User progress not found")
    
    return {
        "current_streak": progress.current_streak,
        "longest_streak": progress.longest_streak,
        "last_activity_date": progress.last_activity_date,
        "streak_freeze_count": progress.streak_freeze_count
    }
