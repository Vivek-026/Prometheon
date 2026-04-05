import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Boolean, Float, ForeignKey, TIMESTAMP, Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func

from app.models.base import BaseModel
from app.models.enums import FlagReasonCategory, FlagProgressStatus, FlagStatus

_vals = lambda e: [x.value for x in e]


class TaskFlag(BaseModel):
    __tablename__ = "task_flags"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False, index=True
    )
    flagged_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    reason_category: Mapped[FlagReasonCategory] = mapped_column(
        PgEnum(FlagReasonCategory, name="flag_reason_category", create_constraint=True, values_callable=_vals),
        nullable=False,
    )
    reason_text: Mapped[str] = mapped_column(Text, nullable=False)
    progress_status: Mapped[FlagProgressStatus] = mapped_column(
        PgEnum(FlagProgressStatus, name="flag_progress_status", create_constraint=True, values_callable=_vals),
        nullable=False,
    )
    handoff_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_hours_remaining: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_late_flag: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    flag_number: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 or 2
    status: Mapped[FlagStatus] = mapped_column(
        PgEnum(FlagStatus, name="flag_status", create_constraint=True, values_callable=_vals),
        nullable=False,
        default=FlagStatus.PENDING_REVIEW,
        server_default="pending_review",
    )
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    # Relationships
    task = relationship("Task", back_populates="flags")
    flagged_by_user = relationship("User", back_populates="flags_raised", foreign_keys=[flagged_by])
    resolver = relationship("User", foreign_keys=[resolved_by])


class ReassignmentHistory(BaseModel):
    __tablename__ = "reassignment_history"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False
    )
    from_user: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    to_user: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    flag_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("task_flags.id"), nullable=True
    )

    # Relationships
    task = relationship("Task")
    from_user_rel = relationship("User", foreign_keys=[from_user])
    to_user_rel = relationship("User", foreign_keys=[to_user])
    flag = relationship("TaskFlag")


class CarryForwardLog(BaseModel):
    __tablename__ = "carry_forward_logs"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False
    )
    carry_number: Mapped[int] = mapped_column(Integer, nullable=False)  # 1, 2, or 3
    from_deadline: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    to_deadline: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_doc_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True
    )

    # Relationships
    task = relationship("Task", back_populates="carry_forward_logs")
    evidence_doc = relationship("Document")
