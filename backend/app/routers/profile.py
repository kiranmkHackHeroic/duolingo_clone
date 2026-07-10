from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, UserAchievement
from app.schemas.user import ProfileResponseSchema
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("", response_model=ProfileResponseSchema)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_result = await db.execute(
        select(User)
        .where(User.id == current_user.id)
        .options(
            selectinload(User.progress),
            selectinload(User.achievements).selectinload(UserAchievement.achievement)
        )
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return ProfileResponseSchema(
        user=user,
        progress=user.progress,
        achievements=user.achievements
    )
