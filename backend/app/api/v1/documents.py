from uuid import UUID
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.storage import get_local_file_path
from app.models.user import User
from app.models.enums import UserRole, DocumentCategory
from app.schemas.document import (
    DocumentOut, DocumentListOut, DocumentCategoryUpdate,
    DocumentVersionLink, PresignedUrlOut,
)
from app.services import document_service

router = APIRouter()


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    category: DocumentCategory = Form(...),
    tags: str = Form(""),  # comma-separated
    task_id: UUID | None = Form(None),
    link_type: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_bytes = await file.read()
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    upload_origin = None
    if task_id:
        upload_origin = f"Task #{task_id}"

    doc = await document_service.upload_document(
        db=db,
        file_bytes=file_bytes,
        original_filename=file.filename or "unnamed",
        content_type=file.content_type or "application/octet-stream",
        file_size=len(file_bytes),
        category=category,
        tags=tag_list,
        uploader=current_user,
        upload_origin=upload_origin,
    )

    # If uploaded via task context, link it
    if task_id and link_type:
        from app.services import task_service
        await task_service.link_document(db, task_id, doc.id, link_type)

    return DocumentOut.model_validate(doc)


@router.get("", response_model=list[DocumentListOut])
async def list_documents(
    category: DocumentCategory | None = None,
    tag: str | None = None,
    uploaded_by: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Finance docs restricted to admin
    if category == DocumentCategory.FINANCE and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Finance documents are admin-only")

    docs = await document_service.list_documents(db, category, tag, uploaded_by, skip, limit)
    return [DocumentListOut.model_validate(d) for d in docs]


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await document_service.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.category == DocumentCategory.FINANCE and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Finance documents are admin-only")

    return DocumentOut.model_validate(doc)


@router.get("/{doc_id}/presigned-url", response_model=PresignedUrlOut)
async def get_presigned_url(
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await document_service.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.category == DocumentCategory.FINANCE and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Finance documents are admin-only")

    url = await document_service.get_presigned_url(db, doc_id)
    return PresignedUrlOut(url=url, expires_in_seconds=900)


@router.patch("/{doc_id}/category", response_model=DocumentOut)
async def update_category(
    doc_id: UUID,
    data: DocumentCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    doc = await document_service.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = await document_service.update_category(db, doc, data.category)
    return DocumentOut.model_validate(doc)


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    doc = await document_service.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    await document_service.soft_delete_document(db, doc)


@router.post("/{doc_id}/link-version", response_model=DocumentOut)
async def link_version(
    doc_id: UUID,
    data: DocumentVersionLink,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await document_service.get_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        doc = await document_service.link_version(db, doc, data.parent_document_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return DocumentOut.model_validate(doc)


@router.get("/by-person/{user_id}", response_model=list[DocumentListOut])
async def get_documents_by_person(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = await document_service.get_documents_by_person(db, user_id, skip, limit)
    return [DocumentListOut.model_validate(d) for d in docs]


# ── Local file serving fallback (dev only) ──

@router.get("/file/{s3_key:path}")
async def serve_local_file(s3_key: str):
    """Serves files from local uploads/ directory when S3 is not configured."""
    file_path = get_local_file_path(s3_key)
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))
