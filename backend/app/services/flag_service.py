from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.task import Task, TaskAssignee
from app.models.flag import TaskFlag, ReassignmentHistory
from app.models.user import User
from app.models.enums import FlagStatus, FlagProgressStatus, TaskStatus
from app.schemas.flag import FlagCreate, FlagResolve


async def raise_flag(
    db: AsyncSession, task_id: UUID, user: User, data: FlagCreate
) -> TaskFlag:
    # Get task
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found")

    if task.is_frozen:
        raise ValueError("Task is frozen")

    # Count existing flags for double-flag guardrail
    flag_count_result = await db.execute(
        select(func.count()).select_from(TaskFlag).where(TaskFlag.task_id == task_id)
    )
    existing_flags = flag_count_result.scalar() or 0

    if existing_flags >= 2:
        raise ValueError("Maximum 2 flags per task allowed")

    flag_number = existing_flags + 1

    # Compute is_late_flag
    is_late = datetime.now(timezone.utc) > task.current_deadline

    # Validate handoff notes requirement
    if data.progress_status != FlagProgressStatus.NOT_STARTED and not data.handoff_notes:
        raise ValueError("Handoff notes are required when progress is above 0%")

    flag = TaskFlag(
        task_id=task_id,
        flagged_by=user.id,
        reason_category=data.reason_category,
        reason_text=data.reason_text,
        progress_status=data.progress_status,
        handoff_notes=data.handoff_notes,
        estimated_hours_remaining=data.estimated_hours_remaining,
        is_late_flag=is_late,
        flag_number=flag_number,
        status=FlagStatus.PENDING_REVIEW,
    )
    db.add(flag)

    # Update task
    task.flag_count = flag_number
    task.status = TaskStatus.FLAGGED
    db.add(task)

    await db.flush()
    await db.refresh(flag)
    return flag


async def list_flags(
    db: AsyncSession,
    status: FlagStatus | None = None,
    task_id: UUID | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[TaskFlag]:
    query = (
        select(TaskFlag)
        .options(
            selectinload(TaskFlag.flagged_by_user),
            selectinload(TaskFlag.resolver),
            selectinload(TaskFlag.task),
        )
        .order_by(TaskFlag.created_at.desc())
    )

    if status:
        query = query.where(TaskFlag.status == status)
    if task_id:
        query = query.where(TaskFlag.task_id == task_id)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_flag(db: AsyncSession, flag_id: UUID) -> TaskFlag | None:
    result = await db.execute(
        select(TaskFlag)
        .options(
            selectinload(TaskFlag.flagged_by_user),
            selectinload(TaskFlag.resolver),
            selectinload(TaskFlag.task),
        )
        .where(TaskFlag.id == flag_id)
    )
    return result.scalar_one_or_none()


async def resolve_flag(
    db: AsyncSession, flag: TaskFlag, resolver: User, data: FlagResolve
) -> TaskFlag:
    task_result = await db.execute(select(Task).where(Task.id == flag.task_id))
    task = task_result.scalar_one_or_none()

    if data.resolution_type == "extended":
        if not data.new_deadline:
            raise ValueError("New deadline required for extension")
        flag.status = FlagStatus.RESOLVED_EXTENDED
        task.current_deadline = data.new_deadline
        task.status = TaskStatus.IN_PROGRESS

    elif data.resolution_type == "reassigned":
        if not data.new_assignee_id:
            raise ValueError("New assignee required for reassignment")
        flag.status = FlagStatus.RESOLVED_REASSIGNED
        task.status = TaskStatus.REASSIGNED

        # Record original assignee on first reassign
        if not task.original_assignee:
            # Get first current assignee
            assignee_result = await db.execute(
                select(TaskAssignee).where(TaskAssignee.task_id == task.id).limit(1)
            )
            first_assignee = assignee_result.scalar_one_or_none()
            if first_assignee:
                task.original_assignee = first_assignee.user_id

        # Create reassignment history
        old_assignee_result = await db.execute(
            select(TaskAssignee).where(TaskAssignee.task_id == task.id).limit(1)
        )
        old_assignee = old_assignee_result.scalar_one_or_none()
        from_user_id = old_assignee.user_id if old_assignee else flag.flagged_by

        history = ReassignmentHistory(
            task_id=task.id,
            from_user=from_user_id,
            to_user=data.new_assignee_id,
            flag_id=flag.id,
        )
        db.add(history)

        # Remove old assignees and add new
        old_assignees_result = await db.execute(
            select(TaskAssignee).where(TaskAssignee.task_id == task.id)
        )
        for old in old_assignees_result.scalars().all():
            await db.delete(old)

        new_assignee = TaskAssignee(task_id=task.id, user_id=data.new_assignee_id)
        db.add(new_assignee)

    elif data.resolution_type == "rescoped":
        flag.status = FlagStatus.RESOLVED_RESCOPED
        task.status = TaskStatus.IN_PROGRESS

    else:
        raise ValueError(f"Invalid resolution type: {data.resolution_type}")

    flag.resolved_by = resolver.id
    flag.resolved_at = datetime.now(timezone.utc)
    db.add(flag)
    db.add(task)

    await db.flush()
    await db.refresh(flag)
    return flag
