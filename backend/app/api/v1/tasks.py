from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.permissions import is_task_assignee
from app.models.user import User
from app.models.enums import UserRole, TaskStatus, TaskPriority
from app.schemas.task import (
    TaskCreate, TaskOut, TaskListOut, TaskStatusUpdate,
    TaskDeadlineUpdate, TaskDocLink,
)
from app.schemas.progress import ProgressEntryCreate, ProgressEntryOut
from app.services import task_service, progress_service

router = APIRouter()


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    task = await task_service.create_task(db, data, current_user)
    return TaskOut.model_validate(task)


@router.get("", response_model=list[TaskListOut])
async def list_tasks(
    status_filter: TaskStatus | None = Query(None, alias="status"),
    priority: TaskPriority | None = None,
    assignee_id: UUID | None = None,
    tag: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = await task_service.list_tasks(db, status_filter, priority, assignee_id, tag, skip, limit)
    return [TaskListOut.model_validate(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskOut.model_validate(task)


@router.patch("/{task_id}/status", response_model=TaskOut)
async def update_task_status(
    task_id: UUID,
    data: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        task = await task_service.transition_status(db, task, data.status, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return TaskOut.model_validate(task)


@router.patch("/{task_id}/deadline", response_model=TaskOut)
async def update_task_deadline(
    task_id: UUID,
    data: TaskDeadlineUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        task = await task_service.extend_deadline(db, task, data.current_deadline, data.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return TaskOut.model_validate(task)


@router.post("/{task_id}/progress", response_model=ProgressEntryOut, status_code=201)
async def add_progress(
    task_id: UUID,
    data: ProgressEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not await is_task_assignee(db, task_id, current_user.id):
        if current_user.role not in (UserRole.TASK_MANAGER, UserRole.ADMIN):
            raise HTTPException(status_code=403, detail="Only assignees can upload progress")

    entry = await progress_service.add_progress_entry(db, task_id, current_user, data)
    return ProgressEntryOut.model_validate(entry)


@router.get("/{task_id}/progress", response_model=list[ProgressEntryOut])
async def list_progress(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entries = await progress_service.list_progress_entries(db, task_id)
    return [ProgressEntryOut.model_validate(e) for e in entries]


@router.post("/{task_id}/link-doc", status_code=201)
async def link_document(
    task_id: UUID,
    data: TaskDocLink,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    await task_service.link_document(db, task_id, data.document_id, data.link_type)
    return {"detail": "Document linked"}


@router.delete("/{task_id}/link-doc/{doc_id}")
async def unlink_document(
    task_id: UUID,
    doc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    removed = await task_service.unlink_document(db, task_id, doc_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Document link not found")
    return {"detail": "Document unlinked"}
