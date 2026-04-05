from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


# ── Request Schemas ──

class AvailabilityUpdate(BaseModel):
    base_unavailable_hours: float | None = None
    weekly_slots: list[dict] | None = None  # Array[7] of { blocked_slots, available_hours, band }


# ── Response Schemas ──

class AvailabilityOut(BaseModel):
    id: UUID
    user_id: UUID
    base_unavailable_hours: float = 11.0
    weekly_slots: list[dict] = []
    updated_at: datetime

    model_config = {"from_attributes": True}


class TeamAvailabilityOut(BaseModel):
    user_id: UUID
    user_name: str
    role: str
    band: str  # HIGH, MED, LOW, BLOCKED
    available_hours: float
