from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import TaskStatus, TaskPriority
from app.schemas.user import UserBrief


# ── Request Schemas ──

class TaskCreate(BaseModel):
    name: str = Field(..., max_length=120)
    description: str
    priority: TaskPriority
    tags: list[str] = []
    current_deadline: datetime
    assignee_ids: list[UUID] = []
    document_ids: list[UUID] = []


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskDeadlineUpdate(BaseModel):
    current_deadline: datetime
    reason: str | None = None


class TaskDocLink(BaseModel):
    document_id: UUID
    link_type: str = "reference"  # brief, progress, reference


# ── Response Schemas ──

class TaskAssigneeOut(BaseModel):
    user: UserBrief
    contribution_pct: int = 0
    assigned_at: datetime

    model_config = {"from_attributes": True}


class TaskOut(BaseModel):
    id: UUID
    name: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    tags: list[str] = []
    created_by: UUID
    creator: UserBrief | None = None
    original_deadline: datetime
    current_deadline: datetime
    carry_forward_count: int = 0
    flag_count: int = 0
    is_frozen: bool = False
    completed_at: datetime | None = None
    assignees: list[TaskAssigneeOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListOut(BaseModel):
    id: UUID
    name: str
    status: TaskStatus
    priority: TaskPriority
    tags: list[str] = []
    current_deadline: datetime
    carry_forward_count: int = 0
    flag_count: int = 0
    is_frozen: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
