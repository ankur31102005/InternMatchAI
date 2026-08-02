"""
Pydantic v2 schemas for Saved Internship operations.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.internship import InternshipResponse


class SavedInternshipResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    internship_id: uuid.UUID
    created_at: datetime
    internship: Optional[InternshipResponse] = None

    model_config = {"from_attributes": True}


class SavedInternshipListResponse(BaseModel):
    total: int
    items: List[SavedInternshipResponse]
