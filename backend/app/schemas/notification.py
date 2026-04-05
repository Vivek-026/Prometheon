from uuid import UUID
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import NotificationType


class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    body: str | None = None
    reference_type: str | None = None
    reference_id: UUID | None = None
    is_read: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
