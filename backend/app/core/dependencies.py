"""
FastAPI dependency for extracting and validating the current user from JWT.
"""

import uuid
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import http_401, UserNotFoundError
from app.database import get_db
from app.models.user import User
from app.services.security import decode_access_token
from app.services.auth_service import AuthService

# ── Bearer Scheme ─────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency – validates the Bearer JWT and returns the current user.
    Raises HTTP 401 if the token is missing, invalid, or expired.
    """
    if not credentials:
        raise http_401("Authentication required. Please provide a Bearer token.")

    user_id_str = decode_access_token(credentials.credentials)
    if not user_id_str:
        raise http_401("Invalid or expired token.")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise http_401("Malformed token payload.")

    try:
        svc = AuthService(db)
        user = await svc.get_user_by_id(user_id)
    except UserNotFoundError:
        raise http_401("User account no longer exists.")

    if not user.is_active:
        raise http_401("Account is deactivated.")

    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require the current user to be an admin."""
    if not current_user.is_admin:
        from app.core.exceptions import http_403
        raise http_403("Admin access required.")
    return current_user


# ── Type Aliases ──────────────────────────────────────────────
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]
