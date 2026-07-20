"""
Pydantic v2 schemas for Internship operations.
"""

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class InternshipSkillOut(BaseModel):
    skill_id: uuid.UUID
    name: str
    is_required: bool
    importance_weight: float

    model_config = {"from_attributes": True}


class InternshipBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    company: str = Field(..., min_length=2, max_length=255)
    description: str
    location: Optional[str] = None
    is_remote: bool = False
    duration_weeks: Optional[int] = None
    stipend_amount: Optional[float] = None
    stipend_currency: str = "INR"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    application_deadline: Optional[date] = None
    is_pm_scheme: bool = True
    sector: Optional[str] = None
    ministry: Optional[str] = None
    min_gpa: Optional[float] = None
    required_degree: Optional[str] = None
    total_seats: Optional[int] = None


class InternshipCreate(InternshipBase):
    pass


class InternshipUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    application_deadline: Optional[date] = None


class InternshipResponse(InternshipBase):
    id: uuid.UUID
    is_active: bool
    seats_filled: int
    created_at: datetime
    skills: List[InternshipSkillOut] = []

    model_config = {"from_attributes": True}


class InternshipListResponse(BaseModel):
    total: int
    page: int
    per_page: int
    items: List[InternshipResponse]
