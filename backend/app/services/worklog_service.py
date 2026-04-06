from uuid import UUID
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.task import Task, TaskAssignee
from app.models.progress import ProgressEntry
from app.models.flag import CarryForwardLog
from app.models.user import User
from app.models.enums import TaskStatus
from app.schemas.worklog import DailyWorklog, WeeklyWorklog, MonthlyWorklog, QuarterlyWorklog, WorklogTask
from app.schemas.task import TaskListOut


async def get_daily_worklog(db: AsyncSession, user_id: UUID, target_date: date) -> DailyWorklog:
    """Get daily worklog — tasks active on that day + progress entries."""
    day_start = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)

    # Get user info
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    user_name = user.name if user else "Unknown"

    # Tasks assigned to user that had activity on this date
    assigned_result = await db.execute(
        select(Task)
        .join(TaskAssignee)
        .where(
            TaskAssignee.user_id == user_id,
            Task.status != TaskStatus.COMPLETED,
        )
        .union(
            select(Task)
            .join(TaskAssignee)
            .where(
                TaskAssignee.user_id == user_id,
                Task.completed_at >= day_start,
                Task.completed_at < day_end,
            )
        )
    )
    tasks = list(assigned_result.scalars().all())

    worklog_tasks = []
    for task in tasks:
        # Count progress entries for this day
        progress_result = await db.execute(
            select(func.count()).select_from(ProgressEntry).where(
                ProgressEntry.task_id == task.id,
                ProgressEntry.uploaded_by == user_id,
                ProgressEntry.created_at >= day_start,
                ProgressEntry.created_at < day_end,
            )
        )
        progress_count = progress_result.scalar() or 0

        worklog_tasks.append(WorklogTask(
            task=TaskListOut.model_validate(task),
            progress_count=progress_count,
        ))

    return DailyWorklog(
        user_id=user_id,
        user_name=user_name,
        date=target_date,
        tasks=worklog_tasks,
    )


async def get_weekly_worklog(db: AsyncSession, user_id: UUID, week_start: date) -> WeeklyWorklog:
    """Get weekly worklog — aggregates daily worklogs."""
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    user_name = user.name if user else "Unknown"

    week_end = week_start + timedelta(days=6)
    daily_summaries = []
    total_completed = 0

    for i in range(7):
        day = week_start + timedelta(days=i)
        daily = await get_daily_worklog(db, user_id, day)
        daily_summaries.append(daily)

    # Count tasks completed this week
    ws = datetime.combine(week_start, datetime.min.time(), tzinfo=timezone.utc)
    we = datetime.combine(week_end + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)
    completed_result = await db.execute(
        select(func.count()).select_from(Task)
        .join(TaskAssignee)
        .where(
            TaskAssignee.user_id == user_id,
            Task.completed_at >= ws,
            Task.completed_at < we,
        )
    )
    total_completed = completed_result.scalar() or 0

    return WeeklyWorklog(
        user_id=user_id,
        user_name=user_name,
        week_start=week_start,
        week_end=week_end,
        daily_summaries=daily_summaries,
        total_tasks_completed=total_completed,
    )


async def get_monthly_worklog(db: AsyncSession, user_id: UUID, year: int, month: int) -> MonthlyWorklog:
    """Get monthly worklog."""
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    user_name = user.name if user else "Unknown"

    month_start = date(year, month, 1)
    if month == 12:
        month_end = date(year + 1, 1, 1)
    else:
        month_end = date(year, month + 1, 1)

    ms = datetime.combine(month_start, datetime.min.time(), tzinfo=timezone.utc)
    me = datetime.combine(month_end, datetime.min.time(), tzinfo=timezone.utc)

    # Tasks completed this month
    completed_result = await db.execute(
        select(func.count()).select_from(Task)
        .join(TaskAssignee)
        .where(
            TaskAssignee.user_id == user_id,
            Task.completed_at >= ms,
            Task.completed_at < me,
        )
    )
    total_completed = completed_result.scalar() or 0

    # Carry forward count
    cf_result = await db.execute(
        select(func.count()).select_from(CarryForwardLog)
        .join(Task)
        .join(TaskAssignee)
        .where(
            TaskAssignee.user_id == user_id,
            CarryForwardLog.created_at >= ms,
            CarryForwardLog.created_at < me,
        )
    )
    carry_forward_count = cf_result.scalar() or 0

    return MonthlyWorklog(
        user_id=user_id,
        user_name=user_name,
        month=f"{year}-{month:02d}",
        total_tasks_completed=total_completed,
        carry_forward_count=carry_forward_count,
    )


async def get_quarterly_worklog(db: AsyncSession, quarter: int, year: int) -> QuarterlyWorklog:
    """Get quarterly worklog for all team members."""
    # Get all users
    users_result = await db.execute(select(User).where(User.is_active == True))
    users = list(users_result.scalars().all())

    quarter_months = {
        1: [1, 2, 3],
        2: [4, 5, 6],
        3: [7, 8, 9],
        4: [10, 11, 12],
    }
    months = quarter_months.get(quarter, [1, 2, 3])

    team_members = []
    for user in users:
        # Aggregate across all 3 months in the quarter
        total_completed = 0
        total_cf = 0
        monthly_summaries = []
        for m in months:
            monthly = await get_monthly_worklog(db, user.id, year, m)
            total_completed += monthly.total_tasks_completed
            total_cf += monthly.carry_forward_count
            monthly_summaries.append(monthly)

        # Create one aggregated entry per user
        team_members.append(MonthlyWorklog(
            user_id=user.id,
            user_name=user.name,
            month=f"{year}-Q{quarter}",
            weekly_summaries=monthly_summaries,
            total_tasks_completed=total_completed,
            carry_forward_count=total_cf,
        ))

    return QuarterlyWorklog(
        quarter=f"Q{quarter}",
        year=year,
        team_members=team_members,
    )
