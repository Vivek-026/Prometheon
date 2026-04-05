from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "prometheon",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
)

# Scheduled tasks — Person B will implement the actual task functions
celery_app.conf.beat_schedule = {
    "carry-forward-check": {
        "task": "app.workers.carry_forward.run_carry_forward_check",
        "schedule": crontab(hour=settings.CARRY_FORWARD_CUTOFF_HOUR, minute=0),
    },
    "flag-expiry-check": {
        "task": "app.workers.notifications.check_flag_expiry",
        "schedule": crontab(minute=0),  # Every hour
    },
    "availability-freshness-alert": {
        "task": "app.workers.notifications.check_availability_freshness",
        "schedule": crontab(hour=9, minute=0),  # Daily at 9 AM IST
    },
    "notification-cleanup": {
        "task": "app.workers.notifications.cleanup_old_notifications",
        "schedule": crontab(hour=3, minute=0, day_of_week="sunday"),  # Weekly
    },
}
