from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import LeaderboardEntry
from app.models.user import User
from app.schemas.user import LeaderboardEntrySchema
from app.services.auth import get_current_user
from typing import List

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])

@router.get("", response_model=List[LeaderboardEntrySchema])
async def get_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(LeaderboardEntry)
        .options(selectinload(LeaderboardEntry.user))
        .order_by(LeaderboardEntry.xp_this_week.desc())
    )
    entries = result.scalars().all()
    
    response = []
    for rank, entry in enumerate(entries, start=1):
        user = entry.user
        response.append(
            LeaderboardEntrySchema(
                rank=rank,
                username=user.username,
                display_name=user.display_name,
                avatar_url=user.avatar_url,
                xp_this_week=entry.xp_this_week,
                is_current_user=(user.id == current_user.id)
            )
        )
    return response
