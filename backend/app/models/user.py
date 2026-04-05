from sqlalchemy import String, Boolean, Text, Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import UserRole, UserStatus

_vals = lambda e: [x.value for x in e]


class User(BaseModel):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        PgEnum(UserRole, name="user_role", create_constraint=True, values_callable=_vals),
        nullable=False,
    )
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[UserStatus] = mapped_column(
        PgEnum(UserStatus, name="user_status", create_constraint=True, values_callable=_vals),
        default=UserStatus.OFFLINE,
        server_default="offline",
    )
    custom_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    # Relationships
    created_tasks = relationship("Task", back_populates="creator", foreign_keys="Task.created_by")
    assigned_tasks = relationship("TaskAssignee", back_populates="user")
    uploaded_documents = relationship("Document", back_populates="uploader")
    flags_raised = relationship("TaskFlag", back_populates="flagged_by_user", foreign_keys="TaskFlag.flagged_by")
    availability = relationship("DevAvailability", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")
