import uuid
from datetime import datetime

from sqlalchemy import String, Text, Boolean, ForeignKey, TIMESTAMP, Enum as PgEnum, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func

from app.models.base import BaseModel
from app.models.enums import MessageType, NotificationPref

_vals = lambda e: [x.value for x in e]


class ChatGroup(BaseModel):
    __tablename__ = "chat_groups"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    creator = relationship("User")
    members = relationship("ChatGroupMember", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="group")


class ChatGroupMember(BaseModel):
    __tablename__ = "chat_group_members"

    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_groups.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    joined_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    is_muted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    notification_pref: Mapped[NotificationPref] = mapped_column(
        PgEnum(NotificationPref, name="notification_pref", create_constraint=True, values_callable=_vals),
        default=NotificationPref.MENTIONS,
        server_default="mentions",
    )

    # Override inherited id PK
    id = None

    # Relationships
    group = relationship("ChatGroup", back_populates="members")
    user = relationship("User")


class DMThread(BaseModel):
    __tablename__ = "dm_threads"

    user_a: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    user_b: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    __table_args__ = (
        CheckConstraint("user_a < user_b", name="ck_dm_threads_user_order"),
    )

    # Relationships
    user_a_rel = relationship("User", foreign_keys=[user_a])
    user_b_rel = relationship("User", foreign_keys=[user_b])
    messages = relationship("Message", back_populates="dm_thread")


class Message(BaseModel):
    __tablename__ = "messages"

    group_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_groups.id"), nullable=True
    )
    dm_thread_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dm_threads.id"), nullable=True
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[MessageType] = mapped_column(
        PgEnum(MessageType, name="message_type", create_constraint=True, values_callable=_vals),
        nullable=False,
    )
    reply_to_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True
    )
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    edited_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    attachment_doc_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True
    )

    # Relationships
    group = relationship("ChatGroup", back_populates="messages")
    dm_thread = relationship("DMThread", back_populates="messages")
    sender = relationship("User")
    reply_to = relationship("Message", remote_side="Message.id")
    attachment = relationship("Document")
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")


class MessageReaction(BaseModel):
    __tablename__ = "message_reactions"

    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    emoji: Mapped[str] = mapped_column(String(50), primary_key=True)

    # Override inherited id PK
    id = None

    # Relationships
    message = relationship("Message", back_populates="reactions")
    user = relationship("User")
