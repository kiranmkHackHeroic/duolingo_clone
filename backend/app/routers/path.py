from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Course, Unit, Skill, UserSkillProgress
from app.schemas.course import CourseSchema, SkillSchema, SkillProgressSchema, UnitSchema
from typing import List

from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/path", tags=["path"])

@router.get("", response_model=CourseSchema)
async def get_learning_path(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Fetch user progress to find active course ID
    from app.models.user import UserProgress
    prog_result = await db.execute(select(UserProgress).where(UserProgress.user_id == current_user.id))
    user_prog = prog_result.scalar_one_or_none()
    active_course_id = user_prog.active_course_id if (user_prog and user_prog.active_course_id) else 1

    # 2. Fetch active course with units and skills
    result = await db.execute(
        select(Course)
        .where(Course.id == active_course_id)
        .options(
            selectinload(Course.units).selectinload(Unit.skills)
        )
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 2. Fetch user's skill progress
    progress_result = await db.execute(
        select(UserSkillProgress).where(UserSkillProgress.user_id == current_user.id)
    )
    progress_list = progress_result.scalars().all()
    progress_map = {p.skill_id: p for p in progress_list}

    # 3. Track completed skill IDs to calculate unlock status
    completed_skills = {
        p.skill_id for p in progress_list if p.status == "completed" or p.crowns >= 1
    }

    units_data = []
    for unit in course.units:
        skills_data = []
        for skill in unit.skills:
            progress_row = progress_map.get(skill.id)
            if progress_row:
                status = progress_row.status
                crowns = progress_row.crowns
                lessons_completed = progress_row.lessons_completed
            else:
                # Calculate dynamically if no DB progress record exists
                if skill.required_skill_id is None:
                    status = "available"
                elif skill.required_skill_id in completed_skills:
                    status = "available"
                else:
                    status = "locked"
                crowns = 0
                lessons_completed = 0

            skills_data.append(
                SkillSchema(
                    id=skill.id,
                    unit_id=skill.unit_id,
                    title=skill.title,
                    icon=skill.icon,
                    order_index=skill.order_index,
                    required_skill_id=skill.required_skill_id,
                    total_lessons=skill.total_lessons,
                    progress=SkillProgressSchema(
                        status=status,
                        crowns=crowns,
                        lessons_completed=lessons_completed
                    )
                )
            )

        units_data.append(
            UnitSchema(
                id=unit.id,
                course_id=unit.course_id,
                title=unit.title,
                description=unit.description,
                order_index=unit.order_index,
                color_theme=unit.color_theme,
                skills=skills_data
            )
        )

    return CourseSchema(
        id=course.id,
        name=course.name,
        language_code=course.language_code,
        flag_emoji=course.flag_emoji,
        units=units_data
    )
