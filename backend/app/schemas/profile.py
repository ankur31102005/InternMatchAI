"""
Pydantic v2 schemas for Profile operations.
"""

import uuid
from typing import List, Optional

from pydantic import BaseModel


class StudentProfileSchema(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[str] = None
    bio: Optional[str] = None
    education: List[dict] = []
    experience: List[dict] = []
    certificates: List[dict] = []
    skills: List[str] = []
    is_onboarding_completed: bool = False

    model_config = {"from_attributes": True}


class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[str] = None
    bio: Optional[str] = None
    education: Optional[List[dict]] = None
    experience: Optional[List[dict]] = None
    certificates: Optional[List[dict]] = None
    skills: Optional[List[str]] = None
    is_onboarding_completed: Optional[bool] = None
