"""
Carry-forward worker — runs daily at cutoff time (default 7 PM IST).
Escalation ladder:
  1st carry → extend deadline by 1 day, log it
  2nd carry → extend deadline by 1 day, log it, escalate to manager
  3rd carry → freeze task (is_frozen=true), no more extensions
"""
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from app.workers.celery_app import celery_app
from app.core.config import get_settings
from app.models.task import Task, TaskAssignee
from app.models.flag import CarryForwardLog
from app.models.notification import Notification
from app.models.enums import TaskStatus, NotificationType

logger = logging.getLogger(__name__)


def _get_sync_session():
    """Create a sync session for Celery workers."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


@celery_app.task(name="app.workers.carry_forward.run_carry_forward_check")
def run_carry_forward_check():
    """
    Runs daily at carry-forward cutoff time.
    Queries overdue tasks and applies escalation ladder.
    """
    db = _get_sync_session()
    try:
        now = datetime.now(timezone.utc)

        # Find overdue, non-completed, non-frozen tasks
        overdue_tasks = db.execute(
            select(Task).where(
                Task.current_deadline <= now,
                Task.status.notin_([TaskStatus.COMPLETED]),
                Task.is_frozen == False,
            )
        ).scalars().all()

        logger.info(f"Found {len(overdue_tasks)} overdue tasks")

        for task in overdue_tasks:
            carry_number = task.carry_forward_count + 1

            if carry_number <= 2:
                # Extend deadline by 1 day
                old_deadline = task.current_deadline
                new_deadline = now + timedelta(days=1)

                task.current_deadline = new_deadline
                task.carry_forward_count = carry_number

                # Log the carry-forward
                log = CarryForwardLog(
                    task_id=task.id,
                    carry_number=carry_number,
                    from_deadline=old_deadline,
                    to_deadline=new_deadline,
                    reason=f"Auto carry-forward #{carry_number}",
                )
                db.add(log)

                # Notify assignees
                assignees = db.execute(
                    select(TaskAssignee.user_id).where(TaskAssignee.task_id == task.id)
                ).scalars().all()

                for uid in assignees:
                    notif = Notification(
                        user_id=uid,
                        type=NotificationType.CARRY_FORWARD,
                        title=f"Task '{task.name}' carried forward (#{carry_number})",
                        body=f"Deadline extended to {new_deadline.strftime('%Y-%m-%d %H:%M')}",
                        reference_type="task",
                        reference_id=task.id,
                    )
                    db.add(notif)

                logger.info(f"Task {task.id}: carry-forward #{carry_number}")

            else:
                # 3rd carry → freeze
                task.is_frozen = True
                task.carry_forward_count = carry_number

                log = CarryForwardLog(
                    task_id=task.id,
                    carry_number=carry_number,
                    from_deadline=task.current_deadline,
                    to_deadline=None,  # frozen, no new deadline
                    reason="Auto-frozen after 3rd carry-forward",
                )
                db.add(log)

                # Notify assignees
                assignees = db.execute(
                    select(TaskAssignee.user_id).where(TaskAssignee.task_id == task.id)
                ).scalars().all()

                for uid in assignees:
                    notif = Notification(
                        user_id=uid,
                        type=NotificationType.CARRY_FORWARD,
                        title=f"Task '{task.name}' FROZEN",
                        body="Task frozen after 3rd carry-forward. Contact admin.",
                        reference_type="task",
                        reference_id=task.id,
                    )
                    db.add(notif)

                logger.info(f"Task {task.id}: FROZEN after 3rd carry")

        db.commit()
        logger.info(f"Carry-forward check complete. Processed {len(overdue_tasks)} tasks.")

    except Exception as e:
        db.rollback()
        logger.error(f"Carry-forward check failed: {e}")
        raise
    finally:
        db.close()
