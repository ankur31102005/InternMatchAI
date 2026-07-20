"""
Applications API routes.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser
from app.core.exceptions import (
    http_400,
    http_404,
    http_409,
)
from app.database import get_db
from app.models.application import Application
from app.models.internship import Internship
from app.schemas.recommendation import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
    MessageResponse,
)

router = APIRouter(prefix="/applications", tags=["Applications"])


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

    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar_one()

    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    applications = result.scalars().all()

    return ApplicationListResponse(
        total=total,
        items=[ApplicationResponse.model_validate(a) for a in applications],
    )


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
