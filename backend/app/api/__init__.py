"""API package – aggregates all routers."""

from app.api.auth.router import router as auth_router
from app.api.users.router import router as users_router
from app.api.resumes.router import router as resumes_router
from app.api.internships.router import router as internships_router
from app.api.recommendations.router import router as recommendations_router
from app.api.applications.router import router as applications_router
from app.api.saved.router import router as saved_router
from app.api.notifications.router import router as notifications_router
from app.api.profile.router import router as profile_router
from app.api.chat.router import router as chat_router

__all__ = [
    "auth_router",
    "users_router",
    "resumes_router",
    "internships_router",
    "recommendations_router",
    "applications_router",
    "saved_router",
    "notifications_router",
    "profile_router",
    "chat_router",
]
