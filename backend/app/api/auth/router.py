"""
Auth API routes – register, login, get current user.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    http_400,
    http_401,
    http_409,
)
from app.database import get_db
from app.schemas.user import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.services.security import get_token_expiry_seconds

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
    summary="Register a new student account",
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Create a new user account.

    - **full_name**: Display name (≥2 chars)
    - **email**: Unique email address
    - **password**: At least 8 chars, one uppercase, one digit
    - **phone**: Optional phone number
    """
    svc = AuthService(db)
    try:
        user = await svc.register(payload)
    except UserAlreadyExistsError as exc:
        raise http_409(str(exc))

    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive a JWT access token",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate with email and password.

    Returns a JWT Bearer token valid for the configured TTL.
    """
    svc = AuthService(db)
    try:
        _, token = await svc.login(payload.email, payload.password)
    except InvalidCredentialsError as exc:
        raise http_401(str(exc))

    return TokenResponse(
        access_token=token,
        expires_in=get_token_expiry_seconds(),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the currently authenticated user",
)
async def get_me(current_user: CurrentUser) -> UserResponse:
    """
    Returns the profile of the currently authenticated user.

    Requires a valid Bearer JWT token in the `Authorization` header.
    """
    return UserResponse.model_validate(current_user)
