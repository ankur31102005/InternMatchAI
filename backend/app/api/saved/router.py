"""
Saved Internships API routes.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser
from app.core.exceptions import http_404
from app.database import get_db
from app.models.internship import Internship
from app.models.saved_internship import SavedInternship
from app.schemas.recommendation import MessageResponse
from app.schemas.saved_internship import (
    SavedInternshipListResponse,
    SavedInternshipResponse,
)

router = APIRouter(prefix="/saved", tags=["Saved Internships"])


@router.get(
    "/",
    response_model=SavedInternshipListResponse,
    summary="List all internships saved by current user",
)
async def list_saved_internships(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> SavedInternshipListResponse:
    """Return all internships saved/bookmarked by the authenticated user."""
    query = (
        select(SavedInternship)
        .where(SavedInternship.user_id == current_user.id)
        .options(selectinload(SavedInternship.internship))
        .order_by(SavedInternship.created_at.desc())
    )
    result = await db.execute(query)
    saved_items = result.scalars().all()

    return SavedInternshipListResponse(
        total=len(saved_items),
        items=[SavedInternshipResponse.model_validate(s) for s in saved_items],
    )


@router.post(
    "/{internship_id}",
    response_model=SavedInternshipResponse,
    summary="Save / bookmark an internship",
)
async def save_internship(
    internship_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> SavedInternshipResponse:
    """
    Bookmark an internship for the authenticated user.
    Idempotent: if already saved, returns the existing record without error.
    """
    # 1. Verify internship exists
    internship_result = await db.execute(
        select(Internship).where(Internship.id == internship_id)
    )
    internship = internship_result.scalar_one_or_none()
    if not internship:
        raise http_404(f"Internship {internship_id} not found.")

    # 2. Check if already saved
    existing_result = await db.execute(
        select(SavedInternship)
        .where(
            SavedInternship.user_id == current_user.id,
            SavedInternship.internship_id == internship_id,
        )
        .options(selectinload(SavedInternship.internship))
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        return SavedInternshipResponse.model_validate(existing)

    # 3. Create new SavedInternship record
    saved = SavedInternship(
        user_id=current_user.id,
        internship_id=internship_id,
    )
    db.add(saved)
    await db.commit()

    # Re-fetch with internship relationship loaded
    refreshed_result = await db.execute(
        select(SavedInternship)
        .where(SavedInternship.id == saved.id)
        .options(selectinload(SavedInternship.internship))
    )
    refreshed_saved = refreshed_result.scalar_one()

    return SavedInternshipResponse.model_validate(refreshed_saved)


@router.delete(
    "/{internship_id}",
    response_model=MessageResponse,
    summary="Remove a saved internship",
)
async def remove_saved_internship(
    internship_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Remove a bookmarked internship for the authenticated user."""
    result = await db.execute(
        select(SavedInternship).where(
            SavedInternship.user_id == current_user.id,
            SavedInternship.internship_id == internship_id,
        )
    )
    saved = result.scalar_one_or_none()
    if saved:
        await db.delete(saved)
        await db.commit()

    return MessageResponse(message="Saved internship removed successfully.")
