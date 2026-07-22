"""
Internship model and InternshipSkill association table.
"""

import uuid
from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.skill import Skill
    from app.models.application import Application
    from app.models.recommendation import Recommendation


class Internship(Base, UUIDMixin, TimestampMixin):
    """
    Internship opportunity listed on the platform.
    """

    __tablename__ = "internships"

    # ── Core Details ──────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_remote: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Duration & Compensation ───────────────────────────────
    duration_weeks: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stipend_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    stipend_currency: Mapped[str] = mapped_column(
        String(10), default="INR", nullable=False
    )

    # ── Dates ─────────────────────────────────────────────────
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    application_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # ── PM Scheme ─────────────────────────────────────────────
    is_pm_scheme: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ministry: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # ── Eligibility ───────────────────────────────────────────
    min_gpa: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)
    required_degree: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # ── Status ────────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    total_seats: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    seats_filled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Relationships ─────────────────────────────────────────
    internship_skills: Mapped[List["InternshipSkill"]] = relationship(
        "InternshipSkill", back_populates="internship", cascade="all, delete-orphan"
    )
    applications: Mapped[List["Application"]] = relationship(
        "Application", back_populates="internship"
    )
    recommendations: Mapped[List["Recommendation"]] = relationship(
        "Recommendation", back_populates="internship"
    )

    def __repr__(self) -> str:
        return f"<Internship id={self.id} title={self.title} company={self.company}>"


class InternshipSkill(Base, UUIDMixin, TimestampMixin):
    """Association between an Internship and a required Skill."""

    __tablename__ = "internship_skills"

    internship_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("internships.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    importance_weight: Mapped[float] = mapped_column(
        Numeric(3, 2), default=1.0, nullable=False
    )

    # ── Relationships ─────────────────────────────────────────
    internship: Mapped["Internship"] = relationship(
        "Internship", back_populates="internship_skills"
    )
    skill: Mapped["Skill"] = relationship("Skill", back_populates="internship_skills")
