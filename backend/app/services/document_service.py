import re
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.document import Document
from app.models.user import User
from app.models.enums import DocumentCategory
from app.core.storage import upload_file, generate_presigned_url, delete_file


def generate_auto_name(
    category: DocumentCategory,
    original_filename: str,
    uploader_name: str,
) -> str:
    """Pattern: [category]-[original_filename]-[uploader_name]-[YYYY-MM-DD]-[HH-MM]"""
    now = datetime.now(timezone.utc)
    # Sanitize: lowercase, replace spaces/special chars with hyphens
    clean_name = re.sub(r"[^a-zA-Z0-9._-]", "-", original_filename.rsplit(".", 1)[0]).lower()
    clean_uploader = re.sub(r"[^a-zA-Z0-9]", "-", uploader_name).lower()
    date_str = now.strftime("%Y-%m-%d-%H-%M")
    return f"{category.value}-{clean_name}-{clean_uploader}-{date_str}"


async def upload_document(
    db: AsyncSession,
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
    file_size: int,
    category: DocumentCategory,
    tags: list[str],
    uploader: User,
    upload_origin: str | None = None,
) -> Document:
    auto_name = generate_auto_name(category, original_filename, uploader.name)
    # Extension from original filename
    ext = ""
    if "." in original_filename:
        ext = "." + original_filename.rsplit(".", 1)[1].lower()
    s3_key = f"{category.value}/{auto_name}{ext}"

    await upload_file(file_bytes, s3_key, content_type)

    doc = Document(
        auto_name=auto_name,
        original_filename=original_filename,
        category=category,
        tags=tags,
        upload_origin=upload_origin,
        uploaded_by=uploader.id,
        s3_key=s3_key,
        mime_type=content_type,
        file_size_bytes=file_size,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc


async def get_document(db: AsyncSession, doc_id: UUID) -> Document | None:
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.uploader))
        .where(Document.id == doc_id)
    )
    return result.scalar_one_or_none()


async def list_documents(
    db: AsyncSession,
    category: DocumentCategory | None = None,
    tag: str | None = None,
    uploaded_by: UUID | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Document]:
    query = select(Document).where(Document.is_current_version == True).order_by(Document.created_at.desc())

    if category:
        query = query.where(Document.category == category)
    if tag:
        query = query.where(Document.tags.any(tag))
    if uploaded_by:
        query = query.where(Document.uploaded_by == uploaded_by)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_presigned_url(db: AsyncSession, doc_id: UUID) -> str | None:
    doc = await get_document(db, doc_id)
    if not doc:
        return None
    return await generate_presigned_url(doc.s3_key)


async def update_category(db: AsyncSession, doc: Document, new_category: DocumentCategory) -> Document:
    doc.category = new_category
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc


async def soft_delete_document(db: AsyncSession, doc: Document) -> None:
    await delete_file(doc.s3_key)
    await db.delete(doc)
    await db.flush()


async def link_version(db: AsyncSession, doc: Document, parent_id: UUID) -> Document:
    """Link doc as a new version of parent_id."""
    parent = await get_document(db, parent_id)
    if not parent:
        raise ValueError("Parent document not found")

    # Mark parent as not current
    parent.is_current_version = False
    db.add(parent)

    # Update current doc
    doc.version_parent_id = parent_id
    doc.version_number = parent.version_number + 1
    doc.is_current_version = True
    db.add(doc)

    await db.flush()
    await db.refresh(doc)
    return doc


async def get_documents_by_person(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 50) -> list[Document]:
    result = await db.execute(
        select(Document)
        .where(Document.uploaded_by == user_id)
        .order_by(Document.created_at.desc())
        .offset(skip).limit(limit)
    )
    return list(result.scalars().all())
