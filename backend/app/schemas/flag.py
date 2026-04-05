from uuid import UUID
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import FlagReasonCategory, FlagProgressStatus, FlagStatus
from app.schemas.user import UserBrief


# ── Request Schemas ──

class FlagCreate(BaseModel):
    reason_category: FlagReasonCategory
    reason_text: str
    progress_status: FlagProgressStatus
    handoff_notes: str | None = None
    estimated_hours_remaining: float | None = None


class FlagResolve(BaseModel):
    resolution_type: str  # "reassigned", "extended", "rescoped"
    new_deadline: datetime | None = None  # for extended
    new_assignee_id: UUID | None = None  # for reassigned
    notes: str | None = None


# ── Response Schemas ──

class FlagOut(BaseModel):
    id: UUID
    task_id: UUID
    flagged_by: UUID
    flagged_by_user: UserBrief | None = None
    reason_category: FlagReasonCategory
    reason_text: str
    progress_status: FlagProgressStatus
    handoff_notes: str | None = None
    estimated_hours_remaining: float | None = None
    is_late_flag: bool = False
    flag_number: int
    status: FlagStatus
    resolved_by: UUID | None = None
    resolver: UserBrief | None = None
    resolved_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
