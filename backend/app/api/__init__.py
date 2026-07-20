"""API package – aggregates all routers."""
from app.api.auth.router import router as auth_router
from app.api.users.router import router as users_router
from app.api.resumes.router import router as resumes_router
from app.api.internships.router import router as internships_router
from app.api.recommendations.router import router as recommendations_router
from app.api.applications.router import router as applications_router

__all__ = [
    "auth_router",
    "users_router",
    "resumes_router",
    "internships_router",
    "recommendations_router",
    "applications_router",
]
