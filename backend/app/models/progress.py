import uuid

from sqlalchemy import Text, ForeignKey, Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import ProgressEntryType

_vals = lambda e: [x.value for x in e]


class ProgressEntry(BaseModel):
    __tablename__ = "progress_entries"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False, index=True
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    entry_type: Mapped[ProgressEntryType] = mapped_column(
        PgEnum(ProgressEntryType, name="progress_entry_type", create_constraint=True, values_callable=_vals),
        nullable=False,
    )
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    task = relationship("Task", back_populates="progress_entries")
    uploader = relationship("User")
    document = relationship("Document")
