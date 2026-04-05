from uuid import UUID
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.availability import DevAvailability
from app.models.user import User
from app.schemas.availability import AvailabilityUpdate, AvailabilityOut, TeamAvailabilityOut


def compute_band(available_hours: float) -> str:
    """Compute availability band from hours."""
    if available_hours >= 6:
        return "HIGH"
    elif available_hours >= 3:
        return "MED"
    elif available_hours >= 1:
        return "LOW"
    return "BLOCKED"


def compute_weekly_average(weekly_slots: list[dict]) -> tuple[float, str]:
    """Compute average available hours and overall band from weekly slots."""
    if not weekly_slots:
        return 0.0, "BLOCKED"
    total = sum(slot.get("available_hours", 0) for slot in weekly_slots)
    avg = total / len(weekly_slots)
    return avg, compute_band(avg)


async def get_availability(db: AsyncSession, user_id: UUID) -> DevAvailability | None:
    result = await db.execute(
        select(DevAvailability)
        .options(selectinload(DevAvailability.user))
        .where(DevAvailability.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def update_availability(
    db: AsyncSession, user_id: UUID, data: AvailabilityUpdate
) -> DevAvailability:
    result = await db.execute(
        select(DevAvailability).where(DevAvailability.user_id == user_id)
    )
    avail = result.scalar_one_or_none()

    if not avail:
        avail = DevAvailability(user_id=user_id)
        db.add(avail)

    if data.base_unavailable_hours is not None:
        avail.base_unavailable_hours = data.base_unavailable_hours

    if data.weekly_slots is not None:
        # Enrich slots with computed bands
        enriched = []
        for slot in data.weekly_slots:
            hours = slot.get("available_hours", 0)
            slot["band"] = compute_band(hours)
            enriched.append(slot)
        avail.weekly_slots = enriched

    await db.flush()
    await db.refresh(avail)
    return avail


async def get_team_availability(db: AsyncSession) -> list[TeamAvailabilityOut]:
    """Get team overview with bands for all active users."""
    users_result = await db.execute(select(User).where(User.is_active == True))
    users = list(users_result.scalars().all())

    team = []
    for user in users:
        avail_result = await db.execute(
            select(DevAvailability).where(DevAvailability.user_id == user.id)
        )
        avail = avail_result.scalar_one_or_none()

        if avail and avail.weekly_slots:
            avg_hours, band = compute_weekly_average(avail.weekly_slots)
        else:
            avg_hours, band = 0.0, "BLOCKED"

        team.append(TeamAvailabilityOut(
            user_id=user.id,
            user_name=user.name,
            role=user.role.value,
            band=band,
            available_hours=round(avg_hours, 1),
        ))

    return team


async def check_freshness(db: AsyncSession) -> list[UUID]:
    """Return user IDs who haven't updated availability in 3+ days."""
    threshold = datetime.now(timezone.utc) - timedelta(days=3)
    result = await db.execute(
        select(DevAvailability.user_id).where(
            DevAvailability.updated_at < threshold
        )
    )
    return [row[0] for row in result.all()]
