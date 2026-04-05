"""
WebSocket ConnectionManager — singleton that tracks active connections.
Both devs can import and use this to broadcast events from their modules.
"""
import json
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections keyed by user_id."""

    def __init__(self):
        self._connections: dict[UUID, WebSocket] = {}

    async def connect(self, user_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self._connections[user_id] = websocket

    def disconnect(self, user_id: UUID):
        self._connections.pop(user_id, None)

    def is_online(self, user_id: UUID) -> bool:
        return user_id in self._connections

    def get_online_users(self) -> list[UUID]:
        return list(self._connections.keys())

    async def send_to_user(self, user_id: UUID, event: dict):
        ws = self._connections.get(user_id)
        if ws:
            await ws.send_text(json.dumps(event, default=str))

    async def broadcast_to_users(self, user_ids: list[UUID], event: dict):
        for uid in user_ids:
            await self.send_to_user(uid, event)

    async def broadcast_all(self, event: dict):
        for uid in list(self._connections.keys()):
            await self.send_to_user(uid, event)


# Singleton instance — import this from anywhere
manager = ConnectionManager()
