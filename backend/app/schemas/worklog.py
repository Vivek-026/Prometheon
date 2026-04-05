from uuid import UUID
from datetime import datetime, date

from pydantic import BaseModel

from app.schemas.task import TaskListOut


class WorklogTask(BaseModel):
    task: TaskListOut
    time_spent_hours: float = 0
    status_transitions: list[str] = []
    progress_count: int = 0


class DailyWorklog(BaseModel):
    user_id: UUID
    user_name: str
    date: date
    tasks: list[WorklogTask] = []
    total_hours: float = 0


class WeeklyWorklog(BaseModel):
    user_id: UUID
    user_name: str
    week_start: date
    week_end: date
    daily_summaries: list[DailyWorklog] = []
    total_tasks_completed: int = 0
    total_hours: float = 0


class MonthlyWorklog(BaseModel):
    user_id: UUID
    user_name: str
    month: str  # "2026-04"
    weekly_summaries: list[WeeklyWorklog] = []
    total_tasks_completed: int = 0
    carry_forward_count: int = 0
    flag_count: int = 0


class QuarterlyWorklog(BaseModel):
    quarter: str  # "Q2"
    year: int
    team_members: list[MonthlyWorklog] = []
