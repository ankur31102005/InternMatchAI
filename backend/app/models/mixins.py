"""
Shared mixins for SQLAlchemy models.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column


class UUIDMixin:
    """Primary key as UUID."""

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )


class TimestampMixin:
    """Automatic created_at / updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
