from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.task import Task, TaskAssignee, TaskDocument
from app.models.user import User
from app.models.enums import TaskStatus, TaskPriority, UserRole
from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskDeadlineUpdate


# ── Status transition rules ──
# Maps (current_status) -> list of (allowed_next_status, allowed_roles)
TRANSITIONS = {
    TaskStatus.PENDING: [
        (TaskStatus.IN_PROGRESS, {UserRole.CODER, UserRole.TASK_MANAGER, UserRole.ADMIN}),
    ],
    TaskStatus.IN_PROGRESS: [
        (TaskStatus.IN_REVIEW, {UserRole.CODER, UserRole.TASK_MANAGER, UserRole.ADMIN}),
        (TaskStatus.FLAGGED, {UserRole.CODER}),
    ],
    TaskStatus.IN_REVIEW: [
        (TaskStatus.COMPLETED, {UserRole.TASK_MANAGER, UserRole.ADMIN}),
        (TaskStatus.IN_PROGRESS, {UserRole.TASK_MANAGER, UserRole.ADMIN}),  # send back
    ],
    TaskStatus.FLAGGED: [
        (TaskStatus.IN_PROGRESS, {UserRole.TASK_MANAGER, UserRole.ADMIN}),
        (TaskStatus.REASSIGNED, {UserRole.TASK_MANAGER, UserRole.ADMIN}),
    ],
    TaskStatus.REASSIGNED: [
        (TaskStatus.PENDING, {UserRole.TASK_MANAGER, UserRole.ADMIN}),
        (TaskStatus.IN_PROGRESS, {UserRole.CODER, UserRole.TASK_MANAGER, UserRole.ADMIN}),
    ],
}


async def create_task(db: AsyncSession, data: TaskCreate, creator: User) -> Task:
    task = Task(
        name=data.name,
        description=data.description,
        priority=data.priority,
        tags=data.tags,
        created_by=creator.id,
        original_deadline=data.current_deadline,
        current_deadline=data.current_deadline,
    )
    db.add(task)
    await db.flush()

    # Add assignees
    for uid in data.assignee_ids:
        assignee = TaskAssignee(task_id=task.id, user_id=uid)
        db.add(assignee)

    # Link documents
    for doc_id in data.document_ids:
        link = TaskDocument(task_id=task.id, document_id=doc_id, link_type="brief")
        db.add(link)

    await db.flush()
    await db.refresh(task)
    return task


async def get_task(db: AsyncSession, task_id: UUID) -> Task | None:
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.assignees).selectinload(TaskAssignee.user),
            selectinload(Task.creator),
            selectinload(Task.documents),
            selectinload(Task.flags),
            selectinload(Task.progress_entries),
        )
        .where(Task.id == task_id)
    )
    return result.scalar_one_or_none()


async def list_tasks(
    db: AsyncSession,
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    assignee_id: UUID | None = None,
    tag: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Task]:
    query = select(Task).order_by(Task.created_at.desc())

    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    if assignee_id:
        query = query.join(TaskAssignee).where(TaskAssignee.user_id == assignee_id)
    if tag:
        query = query.where(Task.tags.any(tag))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


def validate_transition(current_status: TaskStatus, new_status: TaskStatus, role: UserRole) -> bool:
    allowed = TRANSITIONS.get(current_status, [])
    for target, roles in allowed:
        if target == new_status and role in roles:
            return True
    return False


async def transition_status(
    db: AsyncSession, task: Task, new_status: TaskStatus, user: User
) -> Task:
    if task.is_frozen:
        raise ValueError("Task is frozen and cannot be modified")

    if not validate_transition(task.status, new_status, user.role):
        raise ValueError(
            f"Cannot transition from '{task.status.value}' to '{new_status.value}' with role '{user.role.value}'"
        )

    task.status = new_status
    if new_status == TaskStatus.COMPLETED:
        task.completed_at = datetime.now(timezone.utc)

    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


async def extend_deadline(
    db: AsyncSession, task: Task, new_deadline: datetime, reason: str | None = None
) -> Task:
    if task.is_frozen:
        raise ValueError("Task is frozen and cannot be modified")

    task.current_deadline = new_deadline
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


async def link_document(
    db: AsyncSession, task_id: UUID, document_id: UUID, link_type: str
) -> TaskDocument:
    link = TaskDocument(task_id=task_id, document_id=document_id, link_type=link_type)
    db.add(link)
    await db.flush()
    return link


async def unlink_document(db: AsyncSession, task_id: UUID, document_id: UUID) -> bool:
    result = await db.execute(
        select(TaskDocument).where(
            TaskDocument.task_id == task_id,
            TaskDocument.document_id == document_id,
        )
    )
    link = result.scalar_one_or_none()
    if link:
        await db.delete(link)
        await db.flush()
        return True
    return False
