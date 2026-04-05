"""
Resource-level permission checks.
These go beyond role checks — they verify ownership or assignment on specific resources.
Used inside service layer functions, not as route dependencies.
"""
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.task import Task, TaskAssignee
from app.models.chat import ChatGroupMember, DMThread
from app.models.user import User


async def is_task_assignee(db: AsyncSession, task_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(TaskAssignee).where(
            TaskAssignee.task_id == task_id,
            TaskAssignee.user_id == user_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def is_task_creator(db: AsyncSession, task_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.created_by == user_id)
    )
    return result.scalar_one_or_none() is not None


async def is_group_member(db: AsyncSession, group_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(ChatGroupMember).where(
            ChatGroupMember.group_id == group_id,
            ChatGroupMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def is_dm_participant(db: AsyncSession, thread_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(DMThread).where(
            DMThread.id == thread_id,
            ((DMThread.user_a == user_id) | (DMThread.user_b == user_id)),
        )
    )
    return result.scalar_one_or_none() is not None
