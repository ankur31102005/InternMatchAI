"""Schemas package init."""
from app.schemas.user import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    UserMeResponse,
    UserUpdate,
)
from app.schemas.resume import ResumeResponse, ResumeUploadResponse, SkillOut
from app.schemas.internship import (
    InternshipCreate,
    InternshipResponse,
    InternshipListResponse,
    InternshipUpdate,
)
from app.schemas.recommendation import (
    RecommendationResponse,
    RecommendationListResponse,
    ApplicationCreate,
    ApplicationResponse,
    ApplicationListResponse,
    MessageResponse,
    ErrorResponse,
)

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "UserMeResponse",
    "UserUpdate",
    "ResumeResponse",
    "ResumeUploadResponse",
    "SkillOut",
    "InternshipCreate",
    "InternshipResponse",
    "InternshipListResponse",
    "InternshipUpdate",
    "RecommendationResponse",
    "RecommendationListResponse",
    "ApplicationCreate",
    "ApplicationResponse",
    "ApplicationListResponse",
    "MessageResponse",
    "ErrorResponse",
]
