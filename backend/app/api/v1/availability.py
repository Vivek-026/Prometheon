from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.availability import AvailabilityUpdate, AvailabilityOut, TeamAvailabilityOut
from app.services import availability_service

router = APIRouter()


@router.get("/{user_id}", response_model=AvailabilityOut)
async def get_availability(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user availability. Self, manager, or admin."""
    if current_user.id != user_id and current_user.role not in (UserRole.TASK_MANAGER, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not authorized")

    avail = await availability_service.get_availability(db, user_id)
    if not avail:
        raise HTTPException(status_code=404, detail="Availability not set yet")

    return AvailabilityOut.model_validate(avail)


@router.put("", response_model=AvailabilityOut)
async def update_availability(
    data: AvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set weekly availability slots. Self only."""
    avail = await availability_service.update_availability(db, current_user.id, data)
    return AvailabilityOut.model_validate(avail)


@router.get("/team/overview", response_model=list[TeamAvailabilityOut])
async def get_team_availability(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    """Team availability overview with bands. Manager/admin only."""
    return await availability_service.get_team_availability(db)
