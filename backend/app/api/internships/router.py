"""
Internships API routes.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentAdmin
from app.core.exceptions import http_404
from app.database import get_db
from app.models.internship import Internship
from app.schemas.internship import (
    InternshipCreate,
    InternshipListResponse,
    InternshipResponse,
    InternshipUpdate,
)

router = APIRouter(prefix="/internships", tags=["Internships"])


@router.get(
    "/",
    response_model=InternshipListResponse,
    summary="List all active internships",
)
async def list_internships(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector: Optional[str] = Query(None),
    is_remote: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> InternshipListResponse:
    """List active internships with optional filtering and pagination."""
    query = select(Internship).where(Internship.is_active == True)  # noqa: E712

    if sector:
        query = query.where(Internship.sector == sector)
    if is_remote is not None:
        query = query.where(Internship.is_remote == is_remote)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            Internship.title.ilike(search_term)
            | Internship.company.ilike(search_term)
            | Internship.description.ilike(search_term)
        )

    # Count total
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    internships = result.scalars().all()

    return InternshipListResponse(
        total=total,
        page=page,
        per_page=per_page,
        items=[InternshipResponse.model_validate(i) for i in internships],
    )


@router.get(
    "/{internship_id}",
    response_model=InternshipResponse,
    summary="Get internship by ID",
)
async def get_internship(
    internship_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> InternshipResponse:
    """Retrieve a single internship by its UUID."""
    result = await db.execute(select(Internship).where(Internship.id == internship_id))
    internship = result.scalar_one_or_none()
    if not internship:
        raise http_404(f"Internship {internship_id} not found.")
    return InternshipResponse.model_validate(internship)


@router.post(
    "/",
    response_model=InternshipResponse,
    status_code=201,
    summary="Create a new internship (admin only)",
)
async def create_internship(
    payload: InternshipCreate,
    current_admin: CurrentAdmin,
    db: AsyncSession = Depends(get_db),
) -> InternshipResponse:
    """Create a new internship listing. Requires admin privileges."""
    internship = Internship(**payload.model_dump())
    db.add(internship)
    await db.commit()
    await db.refresh(internship)
    return InternshipResponse.model_validate(internship)


@router.patch(
    "/{internship_id}",
    response_model=InternshipResponse,
    summary="Update internship (admin only)",
)
async def update_internship(
    internship_id: uuid.UUID,
    payload: InternshipUpdate,
    current_admin: CurrentAdmin,
    db: AsyncSession = Depends(get_db),
) -> InternshipResponse:
    """Partially update an internship. Requires admin privileges."""
    result = await db.execute(select(Internship).where(Internship.id == internship_id))
    internship = result.scalar_one_or_none()
    if not internship:
        raise http_404(f"Internship {internship_id} not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(internship, field, value)

    await db.commit()
    await db.refresh(internship)
    return InternshipResponse.model_validate(internship)


@router.delete(
    "/{internship_id}",
    status_code=204,
    summary="Delete an internship (admin only)",
)
async def delete_internship(
    internship_id: uuid.UUID,
    current_admin: CurrentAdmin,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Permanently delete an internship. Requires admin privileges.

    Related skills, applications and recommendations are removed automatically
    via ON DELETE CASCADE foreign keys.
    """
    result = await db.execute(select(Internship).where(Internship.id == internship_id))
    internship = result.scalar_one_or_none()
    if not internship:
        raise http_404(f"Internship {internship_id} not found.")

    await db.delete(internship)
    await db.commit()
