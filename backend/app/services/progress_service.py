from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.progress import ProgressEntry
from app.models.user import User
from app.schemas.progress import ProgressEntryCreate


async def add_progress_entry(
    db: AsyncSession, task_id: UUID, user: User, data: ProgressEntryCreate
) -> ProgressEntry:
    entry = ProgressEntry(
        task_id=task_id,
        uploaded_by=user.id,
        entry_type=data.entry_type,
        content=data.content,
        document_id=data.document_id,
        note=data.note,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


async def list_progress_entries(db: AsyncSession, task_id: UUID) -> list[ProgressEntry]:
    result = await db.execute(
        select(ProgressEntry)
        .options(selectinload(ProgressEntry.uploader))
        .where(ProgressEntry.task_id == task_id)
        .order_by(ProgressEntry.created_at.desc())
    )
    return list(result.scalars().all())
