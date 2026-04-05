from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.services import notification_service

router = APIRouter()


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifs = await notification_service.get_user_notifications(
        db, current_user.id, unread_only, skip, limit
    )
    return [NotificationOut.model_validate(n) for n in notifs]


@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = await notification_service.get_unread_count(db, current_user.id)
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = await notification_service.mark_read(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"detail": "Marked as read"}


@router.patch("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = await notification_service.mark_all_read(db, current_user.id)
    return {"marked_read": count}
