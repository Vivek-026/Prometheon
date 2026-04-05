import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func

from app.models.base import BaseModel


class DevAvailability(BaseModel):
    __tablename__ = "dev_availability"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    base_unavailable_hours: Mapped[float] = mapped_column(Float, default=11.0, server_default="11")
    weekly_slots: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default='[]',
        comment="Array[7] of { blocked_slots, available_hours, band }",
    )

    # Relationships
    user = relationship("User", back_populates="availability")
