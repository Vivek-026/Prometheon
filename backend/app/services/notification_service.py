from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload

from app.models.notification import Notification
from app.models.enums import NotificationType


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    type: NotificationType,
    title: str,
    body: str | None = None,
    reference_type: str | None = None,
    reference_id: UUID | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        reference_type=reference_type,
        reference_id=reference_id,
    )
    db.add(notif)
    await db.flush()
    await db.refresh(notif)
    return notif


async def get_user_notifications(
    db: AsyncSession, user_id: UUID, unread_only: bool = False, skip: int = 0, limit: int = 50
) -> list[Notification]:
    query = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )
    if unread_only:
        query = query.where(Notification.is_read == False)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_unread_count(db: AsyncSession, user_id: UUID) -> int:
    result = await db.execute(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
    )
    return result.scalar() or 0


async def mark_read(db: AsyncSession, notification_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        db.add(notif)
        await db.flush()
        return True
    return False


async def mark_all_read(db: AsyncSession, user_id: UUID) -> int:
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.flush()
    return result.rowcount
