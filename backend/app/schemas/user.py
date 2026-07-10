from pydantic import BaseModel
from typing import List, Optional
import datetime

class UserProgressSchema(BaseModel):
    total_xp: int
    current_streak: int
    longest_streak: int
    hearts: int
    max_hearts: int
    gems: int
    daily_xp_goal: int
    xp_today: int
    streak_freeze_count: int
    active_course_id: Optional[int] = 1

    class Config:
        from_attributes = True

class UserProfileSchema(BaseModel):
    username: str
    display_name: str
    avatar_url: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AchievementSchema(BaseModel):
    id: int
    code: str
    title: str
    description: str
    icon: str
    xp_threshold: Optional[int] = None
    streak_threshold: Optional[int] = None

    class Config:
        from_attributes = True

class UserAchievementSchema(BaseModel):
    achievement: AchievementSchema
    earned_at: datetime.datetime

    class Config:
        from_attributes = True

class LeaderboardEntrySchema(BaseModel):
    rank: int
    username: str
    display_name: str
    avatar_url: str
    xp_this_week: int
    is_current_user: bool

class ProfileResponseSchema(BaseModel):
    user: UserProfileSchema
    progress: UserProgressSchema
    achievements: List[UserAchievementSchema]

