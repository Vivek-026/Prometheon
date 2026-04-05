from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import MessageType, NotificationPref
from app.schemas.user import UserBrief


# ── Group Request Schemas ──

class GroupCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: str | None = None
    member_ids: list[UUID] = []


class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon_url: str | None = None


class GroupMemberAdd(BaseModel):
    user_id: UUID


# ── Message Request Schemas ──

class MessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT
    reply_to_id: UUID | None = None
    attachment_doc_id: UUID | None = None


class MessageEdit(BaseModel):
    content: str


class ReactionCreate(BaseModel):
    emoji: str = Field(..., max_length=50)


class MessagePin(BaseModel):
    is_pinned: bool


# ── DM Request ──

class DMCreate(BaseModel):
    user_id: UUID  # the other user


# ── Response Schemas ──

class GroupOut(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    icon_url: str | None = None
    is_default: bool = False
    created_by: UUID
    created_at: datetime
    unread_count: int = 0

    model_config = {"from_attributes": True}


class GroupMemberOut(BaseModel):
    user: UserBrief
    joined_at: datetime
    is_muted: bool = False
    notification_pref: NotificationPref = NotificationPref.MENTIONS

    model_config = {"from_attributes": True}


class ReactionOut(BaseModel):
    emoji: str
    user_id: UUID
    user: UserBrief | None = None

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: UUID
    group_id: UUID | None = None
    dm_thread_id: UUID | None = None
    sender_id: UUID
    sender: UserBrief | None = None
    content: str
    message_type: MessageType
    reply_to_id: UUID | None = None
    is_pinned: bool = False
    is_deleted: bool = False
    is_edited: bool = False
    edited_at: datetime | None = None
    attachment_doc_id: UUID | None = None
    reactions: list[ReactionOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class DMThreadOut(BaseModel):
    id: UUID
    user_a: UUID
    user_b: UUID
    other_user: UserBrief | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
