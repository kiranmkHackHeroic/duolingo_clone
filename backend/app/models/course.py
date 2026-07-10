import datetime
from typing import List, Optional
from sqlalchemy import ForeignKey, String, JSON, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    language_code: Mapped[str] = mapped_column(String(10))
    flag_emoji: Mapped[str] = mapped_column(String(10))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    units: Mapped[List["Unit"]] = relationship(
        back_populates="course", 
        cascade="all, delete-orphan", 
        order_by="Unit.order_index"
    )

class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(200))
    order_index: Mapped[int] = mapped_column(Integer)
    color_theme: Mapped[str] = mapped_column(String(50), default="#58CC02")

    course: Mapped["Course"] = relationship(back_populates="units")
    skills: Mapped[List["Skill"]] = relationship(
        back_populates="unit", 
        cascade="all, delete-orphan", 
        order_by="Skill.order_index"
    )

class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(100))
    icon: Mapped[str] = mapped_column(String(50))
    order_index: Mapped[int] = mapped_column(Integer)
    required_skill_id: Mapped[Optional[int]] = mapped_column(ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    total_lessons: Mapped[int] = mapped_column(Integer, default=3)

    unit: Mapped["Unit"] = relationship(back_populates="skills")
    required_skill: Mapped[Optional["Skill"]] = relationship(remote_side=[id])
    lessons: Mapped[List["Lesson"]] = relationship(
        back_populates="skill", 
        cascade="all, delete-orphan", 
        order_by="Lesson.order_index"
    )

class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    order_index: Mapped[int] = mapped_column(Integer)
    lesson_type: Mapped[str] = mapped_column(String(20), default="new_skill") # new_skill, practice, legendary

    skill: Mapped["Skill"] = relationship(back_populates="lessons")
    exercises: Mapped[List["Exercise"]] = relationship(
        back_populates="lesson", 
        cascade="all, delete-orphan", 
        order_by="Exercise.order_index"
    )

class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    order_index: Mapped[int] = mapped_column(Integer)
    exercise_type: Mapped[str] = mapped_column(String(30)) # multiple_choice, translate, word_bank, match_pairs, fill_blank, type_answer
    prompt: Mapped[str] = mapped_column(String(500))
    data: Mapped[dict] = mapped_column(JSON)
    correct_answer: Mapped[dict] = mapped_column(JSON)

    lesson: Mapped["Lesson"] = relationship(back_populates="exercises")
