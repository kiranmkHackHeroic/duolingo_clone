from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User, UserProgress, LeaderboardEntry
from app.services.auth import hash_password, verify_password, create_access_token
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    display_name: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Make sure username isn't already taken
    existing_result = await db.execute(select(User).where(User.username == req.username))
    existing = existing_result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Hash password and create user record
    new_user = User(
        username=req.username,
        display_name=req.display_name,
        hashed_password=hash_password(req.password),
        avatar_url=f"https://api.dicebear.com/7.x/adventurer/svg?seed={req.username}"
    )
    db.add(new_user)
    await db.flush() # flush to get the user ID for relationships

    # Initialize default starting stats for the user
    default_progress = UserProgress(
        user_id=new_user.id,
        total_xp=0,
        current_streak=0,
        longest_streak=0,
        hearts=5,
        max_hearts=5,
        gems=500,
        daily_xp_goal=50,
        xp_today=0,
        streak_freeze_count=0
    )
    db.add(default_progress)

    # Initialize bronze league leaderboard entry
    default_lb = LeaderboardEntry(
        user_id=new_user.id,
        league="bronze",
        xp_this_week=0
    )
    db.add(default_lb)

    await db.commit()

    token = create_access_token(data={"sub": req.username})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=req.username
    )

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Check password match
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    token = create_access_token(data={"sub": req.username})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=req.username
    )
