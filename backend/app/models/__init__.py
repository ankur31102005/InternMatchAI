"""
Models package – imports all ORM models so Alembic can detect them.
"""

from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.skill import Skill
from app.models.resume import Resume, ResumeSkill
from app.models.internship import Internship, InternshipSkill
from app.models.recommendation import Recommendation
from app.models.application import Application

__all__ = [
    "User",
    "StudentProfile",
    "Skill",
    "Resume",
    "ResumeSkill",
    "Internship",
    "InternshipSkill",
    "Recommendation",
    "Application",
]
