"""
Users API routes – profile management.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.core.exceptions import http_404
from app.database import get_db
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/profile",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_profile(current_user: CurrentUser) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.patch(
    "/profile",
    response_model=UserResponse,
    summary="Update user profile",
)
async def update_profile(
    payload: UserUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update name and/or phone for the current user."""
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)
