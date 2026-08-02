"""
SavedInternship model – tracks bookmarked internships by user.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.internship import Internship


class SavedInternship(Base, UUIDMixin, TimestampMixin):
    """
    Tracks an internship saved/bookmarked by a user.
    """

    __tablename__ = "saved_internships"
    __table_args__ = (
        UniqueConstraint("user_id", "internship_id", name="uq_user_internship_saved"),
    )

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

    # ── Relationships ─────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="saved_internships")
    internship: Mapped["Internship"] = relationship("Internship")

    def __repr__(self) -> str:
        return (
            f"<SavedInternship user_id={self.user_id} "
            f"internship_id={self.internship_id}>"
        )
