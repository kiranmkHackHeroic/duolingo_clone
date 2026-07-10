from pydantic import BaseModel
from typing import List, Optional, Any

class ExerciseSchema(BaseModel):
    id: int
    lesson_id: int
    order_index: int
    exercise_type: str
    prompt: str
    data: Any

    class Config:
        from_attributes = True

class LessonSchema(BaseModel):
    id: int
    skill_id: int
    order_index: int
    lesson_type: str

    class Config:
        from_attributes = True

class SkillProgressSchema(BaseModel):
    status: str
    crowns: int
    lessons_completed: int

class SkillSchema(BaseModel):
    id: int
    unit_id: int
    title: str
    icon: str
    order_index: int
    required_skill_id: Optional[int]
    total_lessons: int
    progress: SkillProgressSchema

    class Config:
        from_attributes = True

class UnitSchema(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    order_index: int
    color_theme: str
    skills: List[SkillSchema]

    class Config:
        from_attributes = True

class CourseSchema(BaseModel):
    id: int
    name: str
    language_code: str
    flag_emoji: str
    units: List[UnitSchema]

    class Config:
        from_attributes = True
