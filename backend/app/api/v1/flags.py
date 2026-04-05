from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.permissions import is_task_assignee
from app.models.user import User
from app.models.enums import UserRole, FlagStatus
from app.schemas.flag import FlagCreate, FlagResolve, FlagOut
from app.services import flag_service

# Task-scoped flag routes (mounted under /tasks)
task_flag_router = APIRouter()

# Standalone flag routes (mounted under /flags)
router = APIRouter()


@task_flag_router.post("/{task_id}/flags", response_model=FlagOut, status_code=201)
async def raise_flag(
    task_id: UUID,
    data: FlagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Raise a flag on a task. Only assignees can flag."""
    if not await is_task_assignee(db, task_id, current_user.id):
        raise HTTPException(status_code=403, detail="Only task assignees can raise flags")

    try:
        flag = await flag_service.raise_flag(db, task_id, current_user, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return FlagOut.model_validate(flag)


@router.get("", response_model=list[FlagOut])
async def list_flags(
    flag_status: FlagStatus | None = Query(None, alias="status"),
    task_id: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    flags = await flag_service.list_flags(db, flag_status, task_id, skip, limit)
    return [FlagOut.model_validate(f) for f in flags]


@router.get("/{flag_id}", response_model=FlagOut)
async def get_flag(
    flag_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    flag = await flag_service.get_flag(db, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    if current_user.role not in (UserRole.TASK_MANAGER, UserRole.ADMIN):
        if flag.flagged_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this flag")

    return FlagOut.model_validate(flag)


@router.patch("/{flag_id}/resolve", response_model=FlagOut)
async def resolve_flag(
    flag_id: UUID,
    data: FlagResolve,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    flag = await flag_service.get_flag(db, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    if flag.status != FlagStatus.PENDING_REVIEW:
        raise HTTPException(status_code=400, detail="Flag is already resolved")

    try:
        flag = await flag_service.resolve_flag(db, flag, current_user, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return FlagOut.model_validate(flag)
