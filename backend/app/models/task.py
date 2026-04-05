import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Boolean, ForeignKey, ARRAY, TIMESTAMP, Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func

from app.models.base import BaseModel
from app.models.enums import TaskStatus, TaskPriority

_vals = lambda e: [x.value for x in e]


class Task(BaseModel):
    __tablename__ = "tasks"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(
        PgEnum(TaskStatus, name="task_status", create_constraint=True, values_callable=_vals),
        nullable=False,
        default=TaskStatus.PENDING,
        server_default="pending",
    )
    priority: Mapped[TaskPriority] = mapped_column(
        PgEnum(TaskPriority, name="task_priority", create_constraint=True, values_callable=_vals),
        nullable=False,
    )
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list, server_default="{}")
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    original_deadline: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    current_deadline: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    carry_forward_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    flag_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    original_assignee: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    is_frozen: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    # Relationships
    creator = relationship("User", back_populates="created_tasks", foreign_keys=[created_by])
    assignees = relationship("TaskAssignee", back_populates="task", cascade="all, delete-orphan")
    documents = relationship("TaskDocument", back_populates="task", cascade="all, delete-orphan")
    flags = relationship("TaskFlag", back_populates="task")
    carry_forward_logs = relationship("CarryForwardLog", back_populates="task")
    progress_entries = relationship("ProgressEntry", back_populates="task")


class TaskAssignee(BaseModel):
    __tablename__ = "task_assignees"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    contribution_pct: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    assigned_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    # Override the inherited id PK — this table uses composite PK
    id = None

    # Relationships
    task = relationship("Task", back_populates="assignees")
    user = relationship("User", back_populates="assigned_tasks")


class TaskDocument(BaseModel):
    __tablename__ = "task_documents"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True
    )
    link_type: Mapped[str] = mapped_column(
        PgEnum("brief", "progress", "reference", name="task_doc_link_type", create_constraint=True),
        nullable=False,
    )
    linked_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )

    # Override the inherited id PK
    id = None

    # Relationships
    task = relationship("Task", back_populates="documents")
    document = relationship("Document", back_populates="task_links")
