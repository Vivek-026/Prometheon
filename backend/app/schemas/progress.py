from uuid import UUID
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import ProgressEntryType
from app.schemas.user import UserBrief


# ── Request Schemas ──

class ProgressEntryCreate(BaseModel):
    entry_type: ProgressEntryType
    content: str | None = None
    document_id: UUID | None = None
    note: str | None = None


# ── Response Schemas ──

class ProgressEntryOut(BaseModel):
    id: UUID
    task_id: UUID
    uploaded_by: UUID
    uploader: UserBrief | None = None
    entry_type: ProgressEntryType
    content: str | None = None
    document_id: UUID | None = None
    note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
