"""
Authentication service – business logic for register, login, token validation.
"""

import uuid
from typing import Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.student_profile import StudentProfile
from app.schemas.user import RegisterRequest
from app.services.security import hash_password, verify_password, create_access_token
from app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
)


class AuthService:
    """Handles all authentication business logic."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def register(self, payload: RegisterRequest) -> User:
        """
        Register a new user.

        Raises:
            UserAlreadyExistsError: If email is already taken.
        """
        # Check duplicate email
        existing = await self._db.execute(
            select(User).where(User.email == payload.email.lower())
        )
        if existing.scalar_one_or_none():
            raise UserAlreadyExistsError(
                f"Email '{payload.email}' is already registered."
            )

        user = User(
            email=payload.email.lower(),
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name,
            phone=payload.phone,
        )
        self._db.add(user)
        await self._db.flush()  # Get the user ID

        # Create empty student profile
        profile = StudentProfile(user_id=user.id)
        self._db.add(profile)

        await self._db.commit()
        await self._db.refresh(user)

        logger.info(f"New user registered: {user.email} (id={user.id})")
        return user

    async def login(self, email: str, password: str) -> tuple[User, str]:
        """
        Authenticate a user and return (user, access_token).

        Raises:
            InvalidCredentialsError: If credentials are incorrect.
        """
        result = await self._db.execute(
            select(User).where(User.email == email.lower())
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError("Invalid email or password.")

        if not user.is_active:
            raise InvalidCredentialsError("Account is deactivated.")

        token = create_access_token(subject=str(user.id))
        logger.info(f"User logged in: {user.email}")
        return user, token

    async def get_user_by_id(self, user_id: uuid.UUID) -> User:
        """
        Retrieve a user by primary key.

        Raises:
            UserNotFoundError: If user does not exist.
        """
        result = await self._db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise UserNotFoundError(f"User {user_id} not found.")
        return user
