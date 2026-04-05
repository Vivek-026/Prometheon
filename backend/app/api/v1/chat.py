from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.permissions import is_group_member, is_dm_participant
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.chat import (
    GroupCreate, GroupUpdate, GroupOut, GroupMemberAdd,
    MessageCreate, MessageEdit, MessageOut, MessagePin,
    ReactionCreate, DMCreate, DMThreadOut,
)
from app.services import chat_service

router = APIRouter()


# ── Groups ──

@router.post("/groups", response_model=GroupOut, status_code=201)
async def create_group(
    data: GroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    group = await chat_service.create_group(db, data, current_user)
    return GroupOut.model_validate(group)


@router.get("/groups", response_model=list[GroupOut])
async def list_groups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    groups = await chat_service.list_user_groups(db, current_user.id)
    return [GroupOut.model_validate(g) for g in groups]


@router.get("/groups/{group_id}/messages", response_model=list[MessageOut])
async def get_group_messages(
    group_id: UUID,
    cursor: datetime | None = Query(None, description="Cursor for pagination (created_at)"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not await is_group_member(db, group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")

    messages = await chat_service.get_messages(db, group_id=group_id, cursor=cursor, limit=limit)
    return [MessageOut.model_validate(m) for m in messages]


@router.post("/groups/{group_id}/messages", response_model=MessageOut, status_code=201)
async def send_group_message(
    group_id: UUID,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not await is_group_member(db, group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a member of this group")

    msg = await chat_service.send_message(db, current_user, data, group_id=group_id)
    return MessageOut.model_validate(msg)


@router.patch("/groups/{group_id}", response_model=GroupOut)
async def update_group(
    group_id: UUID,
    data: GroupUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    group = await chat_service.get_group(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    group = await chat_service.update_group(db, group, data)
    return GroupOut.model_validate(group)


@router.post("/groups/{group_id}/members", status_code=201)
async def add_member(
    group_id: UUID,
    data: GroupMemberAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    try:
        await chat_service.add_member(db, group_id, data.user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"detail": "Member added"}


@router.delete("/groups/{group_id}/members/{user_id}")
async def remove_member(
    group_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    removed = await chat_service.remove_member(db, group_id, user_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"detail": "Member removed"}


# ── DMs ──

@router.post("/dm", response_model=DMThreadOut, status_code=201)
async def start_dm(
    data: DMCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = await chat_service.get_or_create_dm(db, current_user.id, data.user_id)
    return DMThreadOut.model_validate(thread)


@router.get("/dm/{thread_id}/messages", response_model=list[MessageOut])
async def get_dm_messages(
    thread_id: UUID,
    cursor: datetime | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not await is_dm_participant(db, thread_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a participant in this DM")

    messages = await chat_service.get_messages(db, dm_thread_id=thread_id, cursor=cursor, limit=limit)
    return [MessageOut.model_validate(m) for m in messages]


@router.post("/dm/{thread_id}/messages", response_model=MessageOut, status_code=201)
async def send_dm_message(
    thread_id: UUID,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not await is_dm_participant(db, thread_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not a participant in this DM")

    msg = await chat_service.send_message(db, current_user, data, dm_thread_id=thread_id)
    return MessageOut.model_validate(msg)


# ── Message Operations ──

@router.patch("/messages/{message_id}", response_model=MessageOut)
async def edit_message(
    message_id: UUID,
    data: MessageEdit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = await chat_service.get_message(db, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only edit your own messages")

    try:
        message = await chat_service.edit_message(db, message, data.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return MessageOut.model_validate(message)


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = await chat_service.get_message(db, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own messages")

    await chat_service.delete_message(db, message)
    return {"detail": "Message deleted"}


@router.post("/messages/{message_id}/reactions", status_code=201)
async def add_reaction(
    message_id: UUID,
    data: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        await chat_service.add_reaction(db, message_id, current_user.id, data.emoji)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"detail": "Reaction added"}


@router.delete("/messages/{message_id}/reactions/{emoji}")
async def remove_reaction(
    message_id: UUID,
    emoji: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    removed = await chat_service.remove_reaction(db, message_id, current_user.id, emoji)
    if not removed:
        raise HTTPException(status_code=404, detail="Reaction not found")
    return {"detail": "Reaction removed"}


@router.patch("/messages/{message_id}/pin", response_model=MessageOut)
async def pin_message(
    message_id: UUID,
    data: MessagePin,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.TASK_MANAGER, UserRole.ADMIN)),
):
    message = await chat_service.get_message(db, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message = await chat_service.pin_message(db, message, data.is_pinned)
    return MessageOut.model_validate(message)


@router.get("/search", response_model=list[MessageOut])
async def search_messages(
    q: str = Query(..., min_length=1),
    group_id: UUID | None = None,
    dm_thread_id: UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = await chat_service.search_messages(db, q, group_id, dm_thread_id, skip, limit)
    return [MessageOut.model_validate(m) for m in messages]
