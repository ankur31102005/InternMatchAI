"""
Application model – tracks a student's application to an internship.
"""

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.internship import Internship


class Application(Base, UUIDMixin, TimestampMixin):
    """
    Tracks a student's application to an internship.
    Status flows: PENDING → REVIEWED → SHORTLISTED / REJECTED → OFFERED / WITHDRAWN
    """

    __tablename__ = "applications"

    # ── FKs ───────────────────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    internship_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("internships.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Status ────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        nullable=False,
        index=True,
        comment="PENDING|REVIEWED|SHORTLISTED|REJECTED|OFFERED|WITHDRAWN",
    )

    # ── Cover Letter ──────────────────────────────────────────
    cover_letter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ─────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="applications")
    internship: Mapped["Internship"] = relationship(
        "Internship", back_populates="applications"
    )

    def __repr__(self) -> str:
        return (
            f"<Application user_id={self.user_id} "
            f"internship_id={self.internship_id} status={self.status}>"
        )
