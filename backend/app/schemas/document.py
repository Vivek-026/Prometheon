from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import DocumentCategory
from app.schemas.user import UserBrief


# ── Request Schemas ──

class DocumentUploadMeta(BaseModel):
    category: DocumentCategory
    tags: list[str] = []
    task_id: UUID | None = None
    link_type: str | None = None  # brief, progress, reference


class DocumentCategoryUpdate(BaseModel):
    category: DocumentCategory


class DocumentVersionLink(BaseModel):
    parent_document_id: UUID


# ── Response Schemas ──

class DocumentOut(BaseModel):
    id: UUID
    auto_name: str
    original_filename: str
    category: DocumentCategory
    tags: list[str] = []
    upload_origin: str | None = None
    uploaded_by: UUID
    uploader: UserBrief | None = None
    s3_key: str
    mime_type: str
    file_size_bytes: int
    version_parent_id: UUID | None = None
    version_number: int = 1
    is_current_version: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListOut(BaseModel):
    id: UUID
    auto_name: str
    original_filename: str
    category: DocumentCategory
    tags: list[str] = []
    upload_origin: str | None = None
    mime_type: str
    file_size_bytes: int
    version_number: int = 1
    is_current_version: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}


class PresignedUrlOut(BaseModel):
    url: str
    expires_in_seconds: int = 900
