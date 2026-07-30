"""
Applications API routes.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentAdmin, CurrentUser
from app.core.exceptions import (
    http_400,
    http_404,
    http_409,
)
from app.database import get_db
from app.models.application import Application
from app.models.internship import Internship
from app.schemas.recommendation import (
    AdminApplicationItem,
    AdminApplicationListResponse,
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationStatusUpdate,
    MessageResponse,
)
from app.schemas.internship import InternshipResponse

router = APIRouter(prefix="/applications", tags=["Applications"])

# Canonical application stages (stored lowercase).
ALLOWED_STATUSES = {
    "pending",
    "under_review",
    "shortlisted",
    "accepted",
    "rejected",
    "withdrawn",
}


@router.get(
    "/",
    response_model=ApplicationListResponse,
    summary="List current user's applications",
)
async def list_applications(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> ApplicationListResponse:
    """Return all internship applications for the authenticated user."""
    query = (
        select(Application)
        .where(Application.user_id == current_user.id)
        .options(selectinload(Application.internship))
        .order_by(Application.created_at.desc())
    )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    applications = result.scalars().all()

    return ApplicationListResponse(
        total=total,
        items=[ApplicationResponse.model_validate(a) for a in applications],
    )


# ── Admin: applicant management ───────────────────────────────


@router.get(
    "/all",
    response_model=AdminApplicationListResponse,
    summary="List every application (admin only)",
)
async def list_all_applications(
    current_admin: CurrentAdmin,
    status: str | None = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> AdminApplicationListResponse:
    """Return all applications with applicant + internship details."""
    query = (
        select(Application)
        .options(
            selectinload(Application.internship),
            selectinload(Application.user),
        )
        .order_by(Application.created_at.desc())
    )
    if status:
        query = query.where(func.lower(Application.status) == status.lower())

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    applications = result.scalars().all()

    items = [
        AdminApplicationItem(
            id=a.id,
            status=a.status,
            cover_letter=a.cover_letter,
            created_at=a.created_at,
            updated_at=a.updated_at,
            applicant_name=a.user.full_name if a.user else "Unknown",
            applicant_email=a.user.email if a.user else "",
            internship=(
                InternshipResponse.model_validate(a.internship)
                if a.internship
                else None
            ),
        )
        for a in applications
    ]
    return AdminApplicationListResponse(total=total, items=items)


@router.patch(
    "/{application_id}/status",
    response_model=ApplicationResponse,
    summary="Update an application's status (admin only)",
)
async def update_application_status(
    application_id: uuid.UUID,
    payload: ApplicationStatusUpdate,
    current_admin: CurrentAdmin,
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    """Advance an application through the pipeline (admin only)."""
    new_status = payload.status.strip().lower()
    if new_status not in ALLOWED_STATUSES:
        raise http_400(f"Invalid status '{payload.status}'.")

    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(selectinload(Application.internship))
    )
    application = result.scalar_one_or_none()
    if not application:
        raise http_404(f"Application {application_id} not found.")

    application.status = new_status
    await db.commit()
    await db.refresh(application)
    return ApplicationResponse.model_validate(application)


@router.post(
    "/",
    response_model=ApplicationResponse,
    status_code=201,
    summary="Apply to an internship",
)
async def create_application(
    payload: ApplicationCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    """
    Submit an application to an internship.

    - Only one application per user per internship is allowed.
    - Internship must be active.
    """
    # Check internship exists and is active
    internship_result = await db.execute(
        select(Internship).where(Internship.id == payload.internship_id)
    )
    internship = internship_result.scalar_one_or_none()
    if not internship:
        raise http_404(f"Internship {payload.internship_id} not found.")
    if not internship.is_active:
        raise http_400("This internship is no longer accepting applications.")

    # Check for duplicate application
    existing_result = await db.execute(
        select(Application).where(
            Application.user_id == current_user.id,
            Application.internship_id == payload.internship_id,
        )
    )
    if existing_result.scalar_one_or_none():
        raise http_409("You have already applied to this internship.")

    application = Application(
        user_id=current_user.id,
        internship_id=payload.internship_id,
        cover_letter=payload.cover_letter,
        status="PENDING",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    return ApplicationResponse.model_validate(application)


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
    summary="Get application details",
)
async def get_application(
    application_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    """Get a specific application by ID."""
    result = await db.execute(
        select(Application)
        .where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .options(selectinload(Application.internship))
    )
    application = result.scalar_one_or_none()
    if not application:
        raise http_404(f"Application {application_id} not found.")
    return ApplicationResponse.model_validate(application)


@router.delete(
    "/{application_id}",
    response_model=MessageResponse,
    summary="Withdraw an application",
)
async def withdraw_application(
    application_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Withdraw (cancel) an application. Only possible for PENDING applications."""
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise http_404(f"Application {application_id} not found.")

    if application.status not in ("PENDING", "REVIEWED"):
        raise http_400(
            f"Cannot withdraw application with status '{application.status}'."
        )

    application.status = "WITHDRAWN"
    await db.commit()
    return MessageResponse(message="Application withdrawn successfully.")
