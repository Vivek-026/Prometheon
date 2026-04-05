"""
Notification workers — scheduled background tasks.
"""
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, delete

from app.workers.celery_app import celery_app
from app.models.flag import TaskFlag
from app.models.task import Task
from app.models.availability import DevAvailability
from app.models.notification import Notification
from app.models.enums import FlagStatus, TaskStatus, NotificationType

logger = logging.getLogger(__name__)


def _get_sync_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import get_settings
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)
    return sessionmaker(bind=engine)()


@celery_app.task(name="app.workers.notifications.check_flag_expiry")
def check_flag_expiry():
    """
    Hourly: flags where task deadline passed and flag is still pending_review → expire them.
    """
    db = _get_sync_session()
    try:
        now = datetime.now(timezone.utc)

        # Find pending flags on tasks whose deadline has passed
        pending_flags = db.execute(
            select(TaskFlag)
            .join(Task)
            .where(
                TaskFlag.status == FlagStatus.PENDING_REVIEW,
                Task.current_deadline <= now,
            )
        ).scalars().all()

        for flag in pending_flags:
            flag.status = FlagStatus.EXPIRED

            # Notify the flag raiser
            notif = Notification(
                user_id=flag.flagged_by,
                type=NotificationType.FLAG_RESOLVED,
                title=f"Your flag expired (task deadline passed)",
                body="The task deadline passed without manager resolution.",
                reference_type="flag",
                reference_id=flag.id,
            )
            db.add(notif)

        db.commit()
        logger.info(f"Flag expiry check: expired {len(pending_flags)} flags")

    except Exception as e:
        db.rollback()
        logger.error(f"Flag expiry check failed: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.workers.notifications.check_availability_freshness")
def check_availability_freshness():
    """
    Daily 9 AM: devs who haven't updated availability in 3+ days → notify managers.
    """
    db = _get_sync_session()
    try:
        threshold = datetime.now(timezone.utc) - timedelta(days=3)

        stale = db.execute(
            select(DevAvailability).where(DevAvailability.updated_at < threshold)
        ).scalars().all()

        if not stale:
            logger.info("Availability freshness: all up to date")
            return

        # Get all managers/admins to notify
        from app.models.user import User
        from app.models.enums import UserRole
        managers = db.execute(
            select(User.id).where(User.role.in_([UserRole.TASK_MANAGER, UserRole.ADMIN]))
        ).scalars().all()

        stale_names = []
        for avail in stale:
            user = db.execute(select(User).where(User.id == avail.user_id)).scalar_one_or_none()
            if user:
                stale_names.append(user.name)

        for manager_id in managers:
            notif = Notification(
                user_id=manager_id,
                type=NotificationType.DEADLINE_WARNING,
                title=f"{len(stale)} devs have stale availability",
                body=f"Not updated in 3+ days: {', '.join(stale_names)}",
                reference_type="availability",
            )
            db.add(notif)

        db.commit()
        logger.info(f"Availability freshness: {len(stale)} stale, notified {len(managers)} managers")

    except Exception as e:
        db.rollback()
        logger.error(f"Availability freshness check failed: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="app.workers.notifications.cleanup_old_notifications")
def cleanup_old_notifications():
    """
    Weekly: delete read notifications older than 90 days.
    """
    db = _get_sync_session()
    try:
        threshold = datetime.now(timezone.utc) - timedelta(days=90)

        result = db.execute(
            delete(Notification).where(
                Notification.is_read == True,
                Notification.created_at < threshold,
            )
        )
        deleted = result.rowcount
        db.commit()
        logger.info(f"Notification cleanup: deleted {deleted} old notifications")

    except Exception as e:
        db.rollback()
        logger.error(f"Notification cleanup failed: {e}")
        raise
    finally:
        db.close()
