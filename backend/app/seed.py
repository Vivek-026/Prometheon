"""
Seed script — populates the database with test users and default chat groups.
Run with: python -m app.seed
"""
import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models import Base
from app.models.user import User
from app.models.chat import ChatGroup, ChatGroupMember
from app.models.enums import UserRole, UserStatus


SEED_USERS = [
    {
        "name": "Admin User",
        "email": "admin@prometheon.in",
        "password": "admin123",
        "role": UserRole.ADMIN,
    },
    {
        "name": "Task Manager",
        "email": "manager@prometheon.in",
        "password": "manager123",
        "role": UserRole.TASK_MANAGER,
    },
    {
        "name": "Dev One",
        "email": "dev1@prometheon.in",
        "password": "dev123",
        "role": UserRole.CODER,
    },
    {
        "name": "Dev Two",
        "email": "dev2@prometheon.in",
        "password": "dev123",
        "role": UserRole.CODER,
    },
]

DEFAULT_GROUPS = ["General", "Random"]


async def seed():
    # Create tables if they don't exist (for quick local dev)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none() is not None:
            print("Database already seeded. Skipping.")
            return

        # Create users
        users = []
        for u in SEED_USERS:
            user = User(
                name=u["name"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                status=UserStatus.OFFLINE,
            )
            db.add(user)
            users.append(user)

        await db.flush()  # Get IDs assigned
        print(f"Created {len(users)} users")

        # Create default chat groups with all users as members
        admin = users[0]
        for group_name in DEFAULT_GROUPS:
            group = ChatGroup(
                name=group_name,
                description=f"Default {group_name.lower()} channel",
                is_default=True,
                created_by=admin.id,
            )
            db.add(group)
            await db.flush()

            for user in users:
                member = ChatGroupMember(
                    group_id=group.id,
                    user_id=user.id,
                )
                db.add(member)

        await db.commit()
        print("Seed complete!")
        print("\nTest accounts:")
        for u in SEED_USERS:
            print(f"  {u['email']} / {u['password']} ({u['role'].value})")


if __name__ == "__main__":
    asyncio.run(seed())
