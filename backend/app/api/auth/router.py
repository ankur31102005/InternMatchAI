"""
Auth API routes – register, login, get current user.
"""

import secrets

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import CurrentUser
from app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    http_401,
    http_409,
    http_400,
)
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    GoogleAuthRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.services.security import (
    create_access_token,
    get_token_expiry_seconds,
    hash_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


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


@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Login or sign up with a Google account",
)
async def google_auth(
    payload: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Verify a Google ID token, find-or-create the user, and issue our JWT.

    The frontend obtains the ID token via Google Identity Services and posts it
    here. We validate it against Google's tokeninfo endpoint and check that the
    audience matches our configured client ID.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise http_400("Google sign-in is not configured on the server.")

    # 1. Verify the token with Google
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                GOOGLE_TOKENINFO_URL, params={"id_token": payload.credential}
            )
    except httpx.HTTPError:
        raise http_401("Could not reach Google to verify the token.")

    if resp.status_code != 200:
        raise http_401("Invalid Google credential.")

    info = resp.json()

    # 2. Validate audience, issuer and verified email
    if info.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise http_401("Google token was issued for a different app.")
    if info.get("iss") not in GOOGLE_ISSUERS:
        raise http_401("Invalid Google token issuer.")
    email = (info.get("email") or "").lower()
    email_verified = str(info.get("email_verified", "")).lower() == "true"
    if not email or not email_verified:
        raise http_401("Google account email is not verified.")

    full_name = info.get("name") or email.split("@")[0]

    # 3. Find or create the user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise http_401("Account is deactivated.")

    # 4. Issue our own access token
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, expires_in=get_token_expiry_seconds())


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
