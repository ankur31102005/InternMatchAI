"""
Skill model – canonical skill taxonomy.
"""

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.resume import ResumeSkill
    from app.models.internship import InternshipSkill


class Skill(Base, UUIDMixin, TimestampMixin):
    """
    Canonical skill entity (e.g. Python, Machine Learning, Communication).
    Skills are referenced from both resumes and internship requirements.
    """

    __tablename__ = "skills"
    __table_args__ = (UniqueConstraint("name", name="uq_skill_name"),)

    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ─────────────────────────────────────────
    resume_skills: Mapped[List["ResumeSkill"]] = relationship(
        "ResumeSkill", back_populates="skill"
    )
    internship_skills: Mapped[List["InternshipSkill"]] = relationship(
        "InternshipSkill", back_populates="skill"
    )

    def __repr__(self) -> str:
        return f"<Skill name={self.name} category={self.category}>"
