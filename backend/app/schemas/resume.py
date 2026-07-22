"""
Pydantic v2 schemas for Resume operations.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class SkillOut(BaseModel):
    id: uuid.UUID
    name: str
    category: Optional[str] = None
    confidence: Optional[float] = None

    model_config = {"from_attributes": True}


class ResumeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    is_processed: bool
    is_active: bool
    created_at: datetime
    skills: List[SkillOut] = []

    model_config = {"from_attributes": True}


class ResumeUploadResponse(BaseModel):
    message: str
    resume: ResumeResponse
