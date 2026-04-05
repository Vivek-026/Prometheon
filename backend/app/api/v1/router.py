from fastapi import APIRouter

from app.api.v1 import auth, tasks, documents, worklogs, flags, chat, availability, notifications

api_router = APIRouter()

# Auth
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Person A modules
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(worklogs.router, prefix="/worklogs", tags=["Worklogs"])

# Person B modules
# POST /tasks/{id}/flags is under /tasks prefix
api_router.include_router(flags.task_flag_router, prefix="/tasks", tags=["Flags"])
# GET /flags, GET /flags/{id}, PATCH /flags/{id}/resolve
api_router.include_router(flags.router, prefix="/flags", tags=["Flags"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(availability.router, prefix="/availability", tags=["Availability"])

# Notifications
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
