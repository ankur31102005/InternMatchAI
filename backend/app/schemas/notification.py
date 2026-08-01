"""
Pydantic v2 schemas for Notification operations.
"""

import uuid
from datetime import datetime
from typing import List

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    total: int
    items: List[NotificationResponse]


class UnreadCountResponse(BaseModel):
    count: int
