"""
Pydantic v2 schemas for Recommendations and Applications.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.internship import InternshipResponse

# ── Recommendation Schemas ────────────────────────────────────


class RecommendationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    internship_id: uuid.UUID
    match_score: float
    skill_match_score: Optional[float] = None
    semantic_score: Optional[float] = None
    eligibility_score: Optional[float] = None
    rank: Optional[int] = None
    explanation: Optional[str] = None
    matched_skills: Optional[str] = None
    missing_skills: Optional[str] = None
    model_version: Optional[str] = None
    is_viewed: bool
    internship: Optional[InternshipResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RecommendationListResponse(BaseModel):
    total: int
    items: List[RecommendationResponse]


# ── Application Schemas ───────────────────────────────────────


class ApplicationCreate(BaseModel):
    internship_id: uuid.UUID
    cover_letter: Optional[str] = Field(None, max_length=5000)


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    internship_id: uuid.UUID
    status: str
    cover_letter: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    internship: Optional[InternshipResponse] = None

    model_config = {"from_attributes": True}


class ApplicationListResponse(BaseModel):
    total: int
    items: List[ApplicationResponse]


# ── Admin: applicant management ───────────────────────────────


class ApplicationStatusUpdate(BaseModel):
    """Admin payload to move an application to a new stage."""

    status: str = Field(
        ..., description="pending|under_review|shortlisted|accepted|rejected"
    )


class AdminApplicationItem(BaseModel):
    id: uuid.UUID
    status: str
    cover_letter: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    applicant_id: uuid.UUID
    applicant_name: str
    applicant_email: str
    internship: Optional[InternshipResponse] = None


class AdminApplicationListResponse(BaseModel):
    total: int
    items: List[AdminApplicationItem]


# ── Common Schemas ────────────────────────────────────────────


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    status_code: int
