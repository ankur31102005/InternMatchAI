"""
Pydantic v2 schemas for User and Authentication.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# ── Auth Schemas ──────────────────────────────────────────────


class RegisterRequest(BaseModel):
    """Payload for POST /auth/register."""

    full_name: str = Field(..., min_length=2, max_length=255, example="Priya Sharma")
    email: EmailStr = Field(..., example="priya@university.edu")
    password: str = Field(..., min_length=8, max_length=128, example="SecurePass123!")
    phone: Optional[str] = Field(None, max_length=20, example="+91-9876543210")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        return v


class LoginRequest(BaseModel):
    """Payload for POST /auth/login."""

    email: EmailStr = Field(..., example="priya@university.edu")
    password: str = Field(..., example="SecurePass123!")


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Seconds until expiry")


class GoogleAuthRequest(BaseModel):
    """Payload for POST /auth/google – the Google ID-token credential."""

    credential: str = Field(..., description="Google Identity Services ID token")


# ── User Schemas ──────────────────────────────────────────────


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserRoleUpdate(BaseModel):
    """Admin-only payload for changing a user's role/status."""

    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Public user representation (no password)."""

    id: uuid.UUID
    is_active: bool
    is_verified: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserMeResponse(UserResponse):
    """Extended response for GET /auth/me including profile."""

    pass
