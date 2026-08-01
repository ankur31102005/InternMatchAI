"""
Profile API routes – manage current user's StudentProfile.
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.student_profile import StudentProfile
from app.schemas.profile import StudentProfileSchema, StudentProfileUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])


async def _get_or_create_profile(
    user_id: uuid.UUID, db: AsyncSession
) -> StudentProfile:
    result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


def _build_profile_response(
    profile: StudentProfile, current_user
) -> StudentProfileSchema:
    return StudentProfileSchema(
        id=profile.id,
        user_id=profile.user_id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        location=profile.location,
        university=profile.university,
        degree=profile.degree,
        major=profile.major,
        graduation_year=profile.graduation_year,
        gpa=profile.gpa,
        bio=profile.bio,
        education=profile.education or [],
        experience=profile.experience or [],
        certificates=profile.certificates or [],
        skills=profile.skills or [],
        is_onboarding_completed=profile.is_onboarding_completed,
    )


@router.get(
    "/me",
    response_model=StudentProfileSchema,
    summary="Get current user's profile",
)
async def get_my_profile(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> StudentProfileSchema:
    """Return current authenticated user's student profile."""
    profile = await _get_or_create_profile(current_user.id, db)
    return _build_profile_response(profile, current_user)


@router.put(
    "/me",
    response_model=StudentProfileSchema,
    summary="Update current user's profile",
)
async def update_my_profile(
    payload: StudentProfileUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> StudentProfileSchema:
    """Update current user's student profile and personal information."""
    profile = await _get_or_create_profile(current_user.id, db)

    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        current_user.phone = payload.phone

    for field in [
        "location",
        "university",
        "degree",
        "major",
        "graduation_year",
        "gpa",
        "bio",
        "education",
        "experience",
        "certificates",
        "skills",
        "is_onboarding_completed",
    ]:
        val = getattr(payload, field)
        if val is not None:
            setattr(profile, field, val)

    await db.commit()
    await db.refresh(current_user)
    await db.refresh(profile)

    return _build_profile_response(profile, current_user)
