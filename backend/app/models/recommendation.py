"""
Recommendation model – AI-generated internship recommendations for a user.
"""

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Numeric, String, Text, Boolean, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.internship import Internship


class Recommendation(Base, UUIDMixin, TimestampMixin):
    """
    AI-generated recommendation linking a user to an internship.
    Stores match score, explanation, and SHAP values for explainability.
    """

    __tablename__ = "recommendations"

    # ── FKs ───────────────────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    internship_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("internships.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Scoring ───────────────────────────────────────────────
    match_score: Mapped[float] = mapped_column(
        Numeric(5, 4), nullable=False, comment="Overall match score 0-1"
    )
    skill_match_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 4), nullable=True)
    semantic_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 4), nullable=True)
    eligibility_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 4), nullable=True)

    # ── Rank ──────────────────────────────────────────────────
    rank: Mapped[Optional[int]] = mapped_column(nullable=True)

    # ── Explainability ────────────────────────────────────────
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shap_values: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="JSON blob of SHAP feature importances"
    )
    matched_skills: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="JSON list of matched skill names"
    )
    missing_skills: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="JSON list of missing required skills"
    )

    # ── Meta ──────────────────────────────────────────────────
    model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_viewed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Relationships ─────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="recommendations")
    internship: Mapped["Internship"] = relationship(
        "Internship", back_populates="recommendations"
    )

    def __repr__(self) -> str:
        return (
            f"<Recommendation user_id={self.user_id} "
            f"internship_id={self.internship_id} score={self.match_score}>"
        )
