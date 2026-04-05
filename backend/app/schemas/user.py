from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole, UserStatus


# ── Request Schemas ──

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserStatusUpdate(BaseModel):
    status: UserStatus | None = None
    custom_status: str | None = None


# ── Response Schemas ──

class UserOut(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    avatar_url: str | None = None
    status: UserStatus = UserStatus.OFFLINE
    custom_status: str | None = None
    is_active: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}


class UserBrief(BaseModel):
    """Minimal user info for embedding in other responses."""
    id: UUID
    name: str
    role: UserRole
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


# ── Auth Response ──

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshResponse(BaseModel):
    access_token: str
    user: UserOut
