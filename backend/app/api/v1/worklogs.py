from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.worklog import DailyWorklog, WeeklyWorklog, MonthlyWorklog, QuarterlyWorklog
from app.services import worklog_service

router = APIRouter()


@router.get("/daily", response_model=DailyWorklog)
async def get_daily_worklog(
    user_id: UUID,
    target_date: date = Query(default_factory=date.today, alias="date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Users can see their own; managers/admins can see anyone's
    if current_user.id != user_id and current_user.role not in (UserRole.TASK_MANAGER, UserRole.ADMIN):
        user_id = current_user.id

    return await worklog_service.get_daily_worklog(db, user_id, target_date)


@router.get("/weekly", response_model=WeeklyWorklog)
async def get_weekly_worklog(
    user_id: UUID,
    week: date = Query(..., description="Start date of the week (Monday)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role not in (UserRole.TASK_MANAGER, UserRole.ADMIN):
        user_id = current_user.id

    return await worklog_service.get_weekly_worklog(db, user_id, week)


@router.get("/monthly", response_model=MonthlyWorklog)
async def get_monthly_worklog(
    user_id: UUID,
    month: str = Query(..., description="Format: YYYY-MM"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role not in (UserRole.TASK_MANAGER, UserRole.ADMIN):
        user_id = current_user.id

    year, m = month.split("-")
    return await worklog_service.get_monthly_worklog(db, user_id, int(year), int(m))


@router.get("/quarterly", response_model=QuarterlyWorklog)
async def get_quarterly_worklog(
    quarter: int = Query(..., ge=1, le=4),
    year: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    return await worklog_service.get_quarterly_worklog(db, quarter, year)
