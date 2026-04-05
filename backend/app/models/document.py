import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Boolean, BigInteger, ForeignKey, ARRAY, TIMESTAMP, Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func

from app.models.base import BaseModel
from app.models.enums import DocumentCategory

_vals = lambda e: [x.value for x in e]


class Document(BaseModel):
    __tablename__ = "documents"

    auto_name: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[DocumentCategory] = mapped_column(
        PgEnum(DocumentCategory, name="document_category", create_constraint=True, values_callable=_vals),
        nullable=False,
    )
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list, server_default="{}")
    upload_origin: Mapped[str | None] = mapped_column(String(255), nullable=True)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    s3_key: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    version_parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True
    )
    version_number: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    is_current_version: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    # Relationships
    uploader = relationship("User", back_populates="uploaded_documents")
    task_links = relationship("TaskDocument", back_populates="document")
    version_parent = relationship("Document", remote_side="Document.id", backref="child_versions")
