"""
Users API routes – profile management and admin user administration.
"""

import uuid
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentAdmin, CurrentUser
from app.core.exceptions import http_400, http_404
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserRoleUpdate, UserUpdate

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


# ── Admin: user administration ────────────────────────────────


@router.get(
    "/",
    response_model=List[UserResponse],
    summary="List all users (admin only)",
)
async def list_users(
    current_admin: CurrentAdmin,
    db: AsyncSession = Depends(get_db),
) -> List[UserResponse]:
    """Return all users. Requires admin privileges."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    summary="Update a user's role/status (admin only)",
)
async def update_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdate,
    current_admin: CurrentAdmin,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Promote/demote a user to admin, or activate/deactivate them.

    Admins cannot remove their own admin access (to avoid lock-out).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise http_404(f"User {user_id} not found.")

    if user.id == current_admin.id and payload.is_admin is False:
        raise http_400("You cannot remove your own admin access.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
