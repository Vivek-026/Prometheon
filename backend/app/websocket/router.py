"""
WebSocket endpoint — single connection per client.
Authenticates via JWT token in query param, then listens for events.
"""
import json
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.core.security import decode_token
from app.websocket.connection_manager import manager
from app.models.enums import UserStatus

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """
    Connect: ws://host/ws?token=<jwt_access_token>

    Server -> Client events:
      chat:message, chat:typing, chat:reaction,
      task:status_change, task:carry_forward,
      flag:raised, flag:resolved,
      notification, presence:update

    Client -> Server events:
      chat:typing  { group_id | dm_thread_id, is_typing }
    """
    # Authenticate
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = UUID(payload["sub"])

    # Connect
    await manager.connect(user_id, websocket)

    # Broadcast presence
    await manager.broadcast_all({
        "event": "presence:update",
        "data": {"user_id": str(user_id), "status": "online"},
    })

    try:
        while True:
            # Listen for client messages
            raw = await websocket.receive_text()
            data = json.loads(raw)

            event_type = data.get("event")

            if event_type == "chat:typing":
                # Broadcast typing indicator to group/DM members
                await manager.broadcast_all({
                    "event": "chat:typing",
                    "data": {
                        "user_id": str(user_id),
                        "group_id": data.get("data", {}).get("group_id"),
                        "dm_thread_id": data.get("data", {}).get("dm_thread_id"),
                        "is_typing": data.get("data", {}).get("is_typing", False),
                    },
                })

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        # Broadcast offline
        await manager.broadcast_all({
            "event": "presence:update",
            "data": {"user_id": str(user_id), "status": "offline"},
        })
    except Exception:
        manager.disconnect(user_id)
