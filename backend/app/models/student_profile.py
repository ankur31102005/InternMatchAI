"""
StudentProfile model – extended academic and personal details.
"""

import uuid
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, Boolean, Date, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class StudentProfile(Base, UUIDMixin, TimestampMixin):
    """
    Academic and personal details for a student.
    One-to-one with User.
    """

    __tablename__ = "student_profiles"

    # ── FK ────────────────────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # ── Academic ──────────────────────────────────────────────
    university: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    degree: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    major: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    graduation_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gpa: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    student_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # ── Personal ──────────────────────────────────────────────
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Social ────────────────────────────────────────────────
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ── Structured extras (JSON lists of objects) ─────────────
    # education:   [{institution, degree, year}]
    # experience:  [{role, org, period}]
    # certificates:[{name, issuer}]
    # skills:      ["Python", "SQL"]
    education: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    experience: Mapped[Optional[list]] = mapped_column(
        JSON, default=list, nullable=True
    )
    certificates: Mapped[Optional[list]] = mapped_column(
        JSON, default=list, nullable=True
    )
    skills: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)

    # ── PM Scheme Eligibility & Onboarding ────────────────────
    is_eligible_for_pm_scheme: Mapped[bool] = mapped_column(
        default=False, nullable=False
    )
    eligibility_checked_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # ── Relationships ─────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<StudentProfile user_id={self.user_id} university={self.university}>"
