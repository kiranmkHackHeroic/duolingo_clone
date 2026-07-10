from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.course import Course, Skill, Unit
from app.models.user import User, UserProgress, UserSkillProgress
from app.services.auth import get_current_user
from app.schemas.user import UserProgressSchema
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/courses", tags=["courses"])

class CourseResponse(BaseModel):
  id: int
  name: str
  language_code: str
  flag_emoji: str
  class Config:
    from_attributes = True

class CourseSelectRequest(BaseModel):
  course_id: int

@router.get("", response_model=List[CourseResponse])
async def get_courses(
  db: AsyncSession = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  result = await db.execute(select(Course).order_by(Course.id))
  courses = result.scalars().all()
  return courses

@router.post("/select", response_model=UserProgressSchema)
async def select_course(
  req: CourseSelectRequest,
  db: AsyncSession = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  # Check if the requested course exists
  course_result = await db.execute(select(Course).where(Course.id == req.course_id))
  course = course_result.scalar_one_or_none()
  if not course:
    raise HTTPException(status_code=404, detail="Course not found")

  # Update the active course ID in user progress
  prog_result = await db.execute(select(UserProgress).where(UserProgress.user_id == current_user.id))
  progress = prog_result.scalar_one_or_none()
  if not progress:
    raise HTTPException(status_code=404, detail="User progress not found")

  progress.active_course_id = req.course_id

  # If this is the user's first time selecting this course, initialize progress for it.
  # We check if they have any UserSkillProgress records for skills in this course.
  usp_result = await db.execute(
    select(UserSkillProgress)
    .join(Skill)
    .join(Unit)
    .where(UserSkillProgress.user_id == current_user.id, Unit.course_id == req.course_id)
  )
  has_progress = (len(usp_result.scalars().all()) > 0)

  if not has_progress:
    # Unlock the first skill in Unit 1 as the starting point
    first_skill_result = await db.execute(
      select(Skill)
      .join(Unit)
      .where(Unit.course_id == req.course_id, Unit.order_index == 1)
      .order_by(Skill.order_index)
      .limit(1)
    )
    first_skill = first_skill_result.scalar_one_or_none()
    if first_skill:
      first_usp = UserSkillProgress(
        user_id=current_user.id,
        skill_id=first_skill.id,
        status="available",
        crowns=0,
        lessons_completed=0
      )
      db.add(first_usp)

  await db.commit()
  await db.refresh(progress)
  return progress
