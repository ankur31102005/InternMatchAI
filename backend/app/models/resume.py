"""
Resume model and ResumeSkill association table.
"""

import uuid
from typing import TYPE_CHECKING, List, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, Boolean, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import TimestampMixin, UUIDMixin

EMBEDDING_DIM = 384

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.skill import Skill


class Resume(Base, UUIDMixin, TimestampMixin):
    """
    Uploaded resume entity.
    Stores file metadata and extracted text/skills.
    """

    __tablename__ = "resumes"

    # ── FK ────────────────────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # ── File Meta ─────────────────────────────────────────────
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # ── Extracted Data ────────────────────────────────────────
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parsed_data: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment="JSON blob of structured parsed resume"
    )

    # ── Status ────────────────────────────────────────────────
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    processing_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Semantic embedding (Phase 1) ──────────────────────────
    embedding: Mapped[Optional[list]] = mapped_column(
        Vector(EMBEDDING_DIM), nullable=True
    )

    # ── Relationships ─────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="resumes")
    resume_skills: Mapped[List["ResumeSkill"]] = relationship(
        "ResumeSkill", back_populates="resume", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Resume id={self.id} user_id={self.user_id} filename={self.filename}>"


class ResumeSkill(Base, UUIDMixin, TimestampMixin):
    """Association between a Resume and a Skill with confidence score."""

    __tablename__ = "resume_skills"

    resume_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    confidence: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 4), nullable=True, comment="AI extraction confidence 0-1"
    )

    # ── Relationships ─────────────────────────────────────────
    resume: Mapped["Resume"] = relationship("Resume", back_populates="resume_skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="resume_skills")
