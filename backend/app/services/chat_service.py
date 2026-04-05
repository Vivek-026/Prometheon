from uuid import UUID
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.models.chat import ChatGroup, ChatGroupMember, DMThread, Message, MessageReaction
from app.models.user import User
from app.models.enums import MessageType, NotificationPref
from app.schemas.chat import (
    GroupCreate, GroupUpdate, MessageCreate, MessageEdit,
    GroupOut, MessageOut, DMThreadOut,
)


# ── Groups ──

async def create_group(db: AsyncSession, data: GroupCreate, creator: User) -> ChatGroup:
    group = ChatGroup(
        name=data.name,
        description=data.description,
        created_by=creator.id,
    )
    db.add(group)
    await db.flush()

    # Add creator as member
    member = ChatGroupMember(group_id=group.id, user_id=creator.id)
    db.add(member)

    # Add other members
    for uid in data.member_ids:
        if uid != creator.id:
            m = ChatGroupMember(group_id=group.id, user_id=uid)
            db.add(m)

    await db.flush()
    await db.refresh(group)
    return group


async def list_user_groups(db: AsyncSession, user_id: UUID) -> list[dict]:
    """List groups the user is a member of, with unread counts."""
    result = await db.execute(
        select(ChatGroup)
        .join(ChatGroupMember)
        .where(ChatGroupMember.user_id == user_id)
        .order_by(ChatGroup.created_at)
    )
    groups = list(result.scalars().all())

    group_list = []
    for g in groups:
        group_list.append({
            **{c.name: getattr(g, c.name) for c in g.__table__.columns},
            "unread_count": 0,  # TODO: track last-read per user
        })
    return groups


async def get_group(db: AsyncSession, group_id: UUID) -> ChatGroup | None:
    result = await db.execute(
        select(ChatGroup)
        .options(selectinload(ChatGroup.members).selectinload(ChatGroupMember.user))
        .where(ChatGroup.id == group_id)
    )
    return result.scalar_one_or_none()


async def update_group(db: AsyncSession, group: ChatGroup, data: GroupUpdate) -> ChatGroup:
    if data.name is not None:
        group.name = data.name
    if data.description is not None:
        group.description = data.description
    if data.icon_url is not None:
        group.icon_url = data.icon_url
    db.add(group)
    await db.flush()
    await db.refresh(group)
    return group


async def add_member(db: AsyncSession, group_id: UUID, user_id: UUID) -> ChatGroupMember:
    # Check if already a member
    existing = await db.execute(
        select(ChatGroupMember).where(
            ChatGroupMember.group_id == group_id,
            ChatGroupMember.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("User is already a member")

    member = ChatGroupMember(group_id=group_id, user_id=user_id)
    db.add(member)
    await db.flush()
    return member


async def remove_member(db: AsyncSession, group_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(ChatGroupMember).where(
            ChatGroupMember.group_id == group_id,
            ChatGroupMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member:
        await db.delete(member)
        await db.flush()
        return True
    return False


# ── DMs ──

async def get_or_create_dm(db: AsyncSession, user_a_id: UUID, user_b_id: UUID) -> DMThread:
    """Get existing DM thread or create one. Ensures user_a < user_b."""
    a, b = sorted([user_a_id, user_b_id])

    result = await db.execute(
        select(DMThread).where(DMThread.user_a == a, DMThread.user_b == b)
    )
    thread = result.scalar_one_or_none()

    if not thread:
        thread = DMThread(user_a=a, user_b=b)
        db.add(thread)
        await db.flush()
        await db.refresh(thread)

    return thread


async def get_dm_thread(db: AsyncSession, thread_id: UUID) -> DMThread | None:
    result = await db.execute(select(DMThread).where(DMThread.id == thread_id))
    return result.scalar_one_or_none()


# ── Messages ──

async def send_message(
    db: AsyncSession,
    sender: User,
    data: MessageCreate,
    group_id: UUID | None = None,
    dm_thread_id: UUID | None = None,
) -> Message:
    msg = Message(
        group_id=group_id,
        dm_thread_id=dm_thread_id,
        sender_id=sender.id,
        content=data.content,
        message_type=data.message_type,
        reply_to_id=data.reply_to_id,
        attachment_doc_id=data.attachment_doc_id,
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return msg


async def get_messages(
    db: AsyncSession,
    group_id: UUID | None = None,
    dm_thread_id: UUID | None = None,
    cursor: datetime | None = None,
    limit: int = 50,
) -> list[Message]:
    """Cursor-based pagination using created_at."""
    query = (
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.reactions).selectinload(MessageReaction.user),
        )
        .where(Message.is_deleted == False)
    )

    if group_id:
        query = query.where(Message.group_id == group_id)
    elif dm_thread_id:
        query = query.where(Message.dm_thread_id == dm_thread_id)

    if cursor:
        query = query.where(Message.created_at < cursor)

    query = query.order_by(Message.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def edit_message(db: AsyncSession, message: Message, content: str) -> Message:
    """Edit message (must be within 15 minutes)."""
    elapsed = datetime.now(timezone.utc) - message.created_at.replace(tzinfo=timezone.utc)
    if elapsed > timedelta(minutes=15):
        raise ValueError("Messages can only be edited within 15 minutes")

    message.content = content
    message.is_edited = True
    message.edited_at = datetime.now(timezone.utc)
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message


async def delete_message(db: AsyncSession, message: Message) -> Message:
    """Soft-delete a message."""
    message.is_deleted = True
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message


async def add_reaction(db: AsyncSession, message_id: UUID, user_id: UUID, emoji: str) -> MessageReaction:
    # Check if already reacted with same emoji
    existing = await db.execute(
        select(MessageReaction).where(
            MessageReaction.message_id == message_id,
            MessageReaction.user_id == user_id,
            MessageReaction.emoji == emoji,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Already reacted with this emoji")

    reaction = MessageReaction(message_id=message_id, user_id=user_id, emoji=emoji)
    db.add(reaction)
    await db.flush()
    return reaction


async def remove_reaction(db: AsyncSession, message_id: UUID, user_id: UUID, emoji: str) -> bool:
    result = await db.execute(
        select(MessageReaction).where(
            MessageReaction.message_id == message_id,
            MessageReaction.user_id == user_id,
            MessageReaction.emoji == emoji,
        )
    )
    reaction = result.scalar_one_or_none()
    if reaction:
        await db.delete(reaction)
        await db.flush()
        return True
    return False


async def pin_message(db: AsyncSession, message: Message, is_pinned: bool) -> Message:
    message.is_pinned = is_pinned
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message


async def get_message(db: AsyncSession, message_id: UUID) -> Message | None:
    result = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.reactions),
        )
        .where(Message.id == message_id)
    )
    return result.scalar_one_or_none()


async def search_messages(
    db: AsyncSession,
    query_text: str,
    group_id: UUID | None = None,
    dm_thread_id: UUID | None = None,
    skip: int = 0,
    limit: int = 30,
) -> list[Message]:
    """Full-text search across messages."""
    query = (
        select(Message)
        .options(selectinload(Message.sender))
        .where(
            Message.is_deleted == False,
            Message.content.ilike(f"%{query_text}%"),
        )
    )

    if group_id:
        query = query.where(Message.group_id == group_id)
    if dm_thread_id:
        query = query.where(Message.dm_thread_id == dm_thread_id)

    query = query.order_by(Message.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())
