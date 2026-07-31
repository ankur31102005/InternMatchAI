"""
Users API routes – profile management and admin user administration.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentAdmin, CurrentUser
from app.core.exceptions import http_400, http_404
from app.database import get_db
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.user import UserResponse, UserRoleUpdate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


# ── Profile details (education / experience / certificates) ───


class EducationItem(BaseModel):
    id: Optional[str] = None
    institution: str = ""
    degree: str = ""
    year: str = ""


class ExperienceItem(BaseModel):
    id: Optional[str] = None
    role: str = ""
    org: str = ""
    period: str = ""


class CertificateItem(BaseModel):
    id: Optional[str] = None
    name: str = ""
    issuer: str = ""


class ProfileDetails(BaseModel):
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    certificates: List[CertificateItem] = []


async def _get_or_create_profile(
    user_id: uuid.UUID, db: AsyncSession
) -> StudentProfile:
    profile = (
        await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == user_id)
        )
    ).scalar_one_or_none()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


@router.get(
    "/profile/details",
    response_model=ProfileDetails,
    summary="Get education / experience / certificates",
)
async def get_profile_details(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ProfileDetails:
    profile = await _get_or_create_profile(current_user.id, db)
    return ProfileDetails(
        education=profile.education or [],
        experience=profile.experience or [],
        certificates=profile.certificates or [],
    )


@router.put(
    "/profile/details",
    response_model=ProfileDetails,
    summary="Save education / experience / certificates",
)
async def update_profile_details(
    payload: ProfileDetails,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ProfileDetails:
    profile = await _get_or_create_profile(current_user.id, db)
    profile.education = [e.model_dump() for e in payload.education]
    profile.experience = [e.model_dump() for e in payload.experience]
    profile.certificates = [c.model_dump() for c in payload.certificates]
    await db.commit()
    return payload


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
