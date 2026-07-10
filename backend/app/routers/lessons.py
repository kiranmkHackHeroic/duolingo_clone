import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import (
    Skill, Lesson, Exercise, UserProgress, UserSkillProgress,
    LessonAttempt, Achievement, UserAchievement, LeaderboardEntry
)
from app.models.user import User
from app.services.streak import compute_streak
from app.services.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional, Any

router = APIRouter(tags=["lessons"])

class AnswerRequest(BaseModel):
    answer: Any

class AnswerResponse(BaseModel):
    correct: bool = False
    correct_answer: Optional[Any] = None
    xp_delta: int = 0
    hearts_remaining: int

class CompleteRequest(BaseModel):
    mistakes: int
    exercises_answered: int

class AchievementResponse(BaseModel):
    id: int
    code: str
    title: str
    description: str
    icon: str
    class Config:
        from_attributes = True

class CompleteResponse(BaseModel):
    xp_earned: int
    hearts_lost: int
    mistakes_count: int
    is_perfect: bool
    streak_updated: bool
    new_streak: int
    crowns_earned: int
    new_achievements: List[AchievementResponse]

def normalize_text(text: str) -> str:
    return " ".join(text.lower().strip().split())

@router.get("/api/skills/{skill_id}/lesson")
async def get_lesson(
    skill_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch user progress to check hearts
    prog_result = await db.execute(select(UserProgress).where(UserProgress.user_id == current_user.id))
    progress = prog_result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="User progress not found")
    
    if progress.hearts <= 0:
        raise HTTPException(status_code=403, detail="heart_empty")

    # 2. Fetch skill details
    skill_result = await db.execute(
        select(Skill)
        .where(Skill.id == skill_id)
        .options(selectinload(Skill.lessons))
    )
    skill = skill_result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # 3. Check requirements
    if skill.required_skill_id is not None:
        req_progress = await db.execute(
            select(UserSkillProgress)
            .where(UserSkillProgress.user_id == current_user.id, UserSkillProgress.skill_id == skill.required_skill_id)
        )
        req_prog = req_progress.scalar_one_or_none()
        if not req_prog or req_prog.status != "completed":
            raise HTTPException(status_code=403, detail="Skill is locked")

    # 4. Fetch or create user skill progress
    usp_result = await db.execute(
        select(UserSkillProgress)
        .where(UserSkillProgress.user_id == current_user.id, UserSkillProgress.skill_id == skill_id)
    )
    usp = usp_result.scalar_one_or_none()
    if not usp:
        usp = UserSkillProgress(user_id=current_user.id, skill_id=skill_id, status="available", crowns=0, lessons_completed=0)
        db.add(usp)
        await db.flush()

    # 5. Determine which lesson to serve
    lesson_idx = usp.lessons_completed
    target_idx = (lesson_idx % len(skill.lessons)) if skill.lessons else 0
    
    lessons_sorted = sorted(skill.lessons, key=lambda l: l.order_index)
    if not lessons_sorted:
        raise HTTPException(status_code=404, detail="No lessons found for this skill")
        
    lesson = lessons_sorted[target_idx]

    # 6. Fetch exercises for this lesson
    ex_result = await db.execute(
        select(Exercise)
        .where(Exercise.lesson_id == lesson.id)
        .order_by(Exercise.order_index)
    )
    exercises = ex_result.scalars().all()

    exercises_data = []
    for ex in exercises:
        exercises_data.append({
            "id": ex.id,
            "lesson_id": ex.lesson_id,
            "order_index": ex.order_index,
            "exercise_type": ex.exercise_type,
            "prompt": ex.prompt,
            "data": ex.data
        })

    return {
        "lesson_id": lesson.id,
        "exercises": exercises_data
    }

@router.post("/api/exercises/{id}/answer")
async def check_answer(
    id: int, 
    req: AnswerRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Check user hearts
    prog_result = await db.execute(select(UserProgress).where(UserProgress.user_id == current_user.id))
    progress = prog_result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="User progress not found")
    
    if progress.hearts <= 0:
        raise HTTPException(status_code=403, detail="heart_empty")

    # 2. Fetch exercise
    ex_result = await db.execute(select(Exercise).where(Exercise.id == id))
    exercise = ex_result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    # 3. Evaluate answer
    is_correct = False
    answer = req.answer
    correct_answer = exercise.correct_answer

    if exercise.exercise_type == "multiple_choice":
        ans_idx = answer.get("index") if isinstance(answer, dict) else answer
        correct_idx = correct_answer.get("index") if isinstance(correct_answer, dict) else correct_answer
        is_correct = (ans_idx == correct_idx)
        
    elif exercise.exercise_type in ["translate", "type_answer"]:
        ans_text = answer.get("text") if isinstance(answer, dict) else answer
        if ans_text:
            ans_norm = normalize_text(str(ans_text))
            accepted_norms = [normalize_text(t) for t in correct_answer.get("accepted", [])]
            is_correct = (ans_norm in accepted_norms)

    elif exercise.exercise_type == "fill_blank":
        ans_text = answer.get("answer") if isinstance(answer, dict) else answer
        if ans_text:
            ans_norm = normalize_text(str(ans_text))
            correct_norm = normalize_text(correct_answer.get("answer", ""))
            is_correct = (ans_norm == correct_norm)

    elif exercise.exercise_type == "word_bank":
        ans_seq = answer.get("sequence") if isinstance(answer, dict) else answer
        correct_seq = correct_answer.get("sequence", [])
        if ans_seq and len(ans_seq) == len(correct_seq):
            is_correct = all(
                normalize_text(a) == normalize_text(c) 
                for a, c in zip(ans_seq, correct_seq)
            )

    elif exercise.exercise_type == "match_pairs":
        user_pairs = answer.get("pairs") if isinstance(answer, dict) else answer
        original_pairs = exercise.data.get("pairs", [])
        if user_pairs:
            user_set = {tuple(sorted(p)) for p in user_pairs}
            orig_set = {tuple(sorted(p)) for p in original_pairs}
            is_correct = (user_set == orig_set)

    # 4. Handle heart reduction if wrong
    if not is_correct:
        progress.hearts = max(0, progress.hearts - 1)
        await db.commit()
        await db.refresh(progress)

    return {
        "correct": is_correct,
        "correct_answer": correct_answer if not is_correct else None,
        "xp_delta": 0,
        "hearts_remaining": progress.hearts
    }

@router.post("/api/lessons/{id}/complete", response_model=CompleteResponse)
async def complete_lesson(
    id: int, 
    req: CompleteRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch lesson
    lesson_result = await db.execute(
        select(Lesson)
        .where(Lesson.id == id)
        .options(selectinload(Lesson.skill))
    )
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    skill = lesson.skill

    # 2. Fetch user progress
    prog_result = await db.execute(select(UserProgress).where(UserProgress.user_id == current_user.id))
    progress = prog_result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="User progress not found")

    # 3. Calculate XP Earned
    base_xp = 10
    is_perfect = (req.mistakes == 0)
    bonus_xp = 5 if is_perfect else 0
    total_xp_earned = base_xp + bonus_xp

    # 4. Update user progress stats
    progress.total_xp += total_xp_earned
    progress.xp_today += total_xp_earned

    # Update streak using compute_streak pure service
    today = datetime.date.today()
    new_streak, was_streak_incremented = compute_streak(
        progress.last_activity_date, 
        progress.current_streak, 
        today
    )
    if was_streak_incremented:
        progress.current_streak = new_streak
        progress.last_activity_date = today
        if new_streak > progress.longest_streak:
            progress.longest_streak = new_streak

    # 5. Update leaderboard weekly XP
    leaderboard_result = await db.execute(
        select(LeaderboardEntry).where(LeaderboardEntry.user_id == current_user.id)
    )
    lb_entry = leaderboard_result.scalar_one_or_none()
    if lb_entry:
        lb_entry.xp_this_week += total_xp_earned

    # 6. Update user skill progress
    usp_result = await db.execute(
        select(UserSkillProgress)
        .where(UserSkillProgress.user_id == current_user.id, UserSkillProgress.skill_id == skill.id)
    )
    usp = usp_result.scalar_one_or_none()
    if not usp:
        usp = UserSkillProgress(user_id=current_user.id, skill_id=skill.id, status="in_progress", crowns=0, lessons_completed=0)
        db.add(usp)

    crowns_earned = 0
    usp.lessons_completed += 1
    usp.last_practiced_at = datetime.datetime.utcnow()

    # Mark as completed if all lessons completed
    if usp.lessons_completed >= skill.total_lessons:
        if usp.status != "completed":
            usp.status = "completed"
            usp.crowns = min(5, usp.crowns + 1)
            crowns_earned = 1
            
            # Unlock cascade: Unlock all skills that list this skill as a required_skill_id
            unlocked_skills_result = await db.execute(
                select(Skill).where(Skill.required_skill_id == skill.id)
            )
            to_unlock = unlocked_skills_result.scalars().all()
            for s in to_unlock:
                s_usp_res = await db.execute(
                    select(UserSkillProgress)
                    .where(UserSkillProgress.user_id == current_user.id, UserSkillProgress.skill_id == s.id)
                )
                s_usp = s_usp_res.scalar_one_or_none()
                if not s_usp:
                    s_usp = UserSkillProgress(user_id=current_user.id, skill_id=s.id, status="available", crowns=0, lessons_completed=0)
                    db.add(s_usp)
                elif s_usp.status == "locked":
                    s_usp.status = "available"

        else:
            if usp.lessons_completed > skill.total_lessons:
                usp.lessons_completed = skill.total_lessons

    # 7. Check Achievements
    new_achievements = []
    achievements_result = await db.execute(select(Achievement))
    all_achievements = achievements_result.scalars().all()

    # Fetch currently earned achievement codes
    earned_result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == current_user.id)
    )
    earned_ids = {ua.achievement_id for ua in earned_result.scalars().all()}

    for ach in all_achievements:
        if ach.id not in earned_ids:
            earned = False
            if ach.xp_threshold is not None and progress.total_xp >= ach.xp_threshold:
                earned = True
            if ach.streak_threshold is not None and progress.current_streak >= ach.streak_threshold:
                earned = True
            if ach.code == "perfect_lesson" and is_perfect:
                earned = True

            if earned:
                ua = UserAchievement(user_id=current_user.id, achievement_id=ach.id)
                db.add(ua)
                new_achievements.append(ach)

    # 8. Record lesson attempt
    attempt = LessonAttempt(
        user_id=current_user.id,
        lesson_id=id,
        completed_at=datetime.datetime.utcnow(),
        xp_earned=total_xp_earned,
        hearts_lost=5 - progress.hearts,
        mistakes_count=req.mistakes,
        is_perfect=is_perfect
    )
    db.add(attempt)

    await db.commit()

    return CompleteResponse(
        xp_earned=total_xp_earned,
        hearts_lost=attempt.hearts_lost,
        mistakes_count=req.mistakes,
        is_perfect=is_perfect,
        streak_updated=was_streak_incremented,
        new_streak=progress.current_streak,
        crowns_earned=crowns_earned,
        new_achievements=[
            AchievementResponse(
                id=a.id,
                code=a.code,
                title=a.title,
                description=a.description,
                icon=a.icon
            ) for a in new_achievements
        ]
    )
