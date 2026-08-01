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
from app.schemas.saved_internship import (
    SavedInternshipResponse,
    SavedInternshipListResponse,
)
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
)
from app.schemas.profile import (
    StudentProfileSchema,
    StudentProfileUpdate,
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
    "SavedInternshipResponse",
    "SavedInternshipListResponse",
    "NotificationResponse",
    "NotificationListResponse",
    "UnreadCountResponse",
    "StudentProfileSchema",
    "StudentProfileUpdate",
    "MessageResponse",
    "ErrorResponse",
]
