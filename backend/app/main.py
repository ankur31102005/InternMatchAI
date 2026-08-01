"""
InternMatch AI – FastAPI Application Entry Point.

Run locally:
    uvicorn app.main:app --reload

Run with Docker:
    docker compose up backend
"""

import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.api import (
    auth_router,
    users_router,
    resumes_router,
    internships_router,
    recommendations_router,
    applications_router,
    saved_router,
    notifications_router,
    profile_router,
    chat_router,
)
from app.config import settings
from app.core.exceptions import InternMatchError
from app.database import engine
from app.models import *  # noqa: F401, F403 – ensure all models are registered

# ── Lifespan ──────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application startup/shutdown lifecycle manager."""
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"   Environment : {settings.ENVIRONMENT}")
    logger.info(f"   Debug mode  : {settings.DEBUG}")

    if "sqlite" in settings.DATABASE_URL:
        logger.info("ℹ️ SQLite database detected. Auto-creating database tables...")
        from app.database import Base

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created successfully.")
    else:
        # Postgres: ensure pgvector + embedding columns exist (idempotent).
        from sqlalchemy import text

        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.execute(
                text(
                    "ALTER TABLE internships "
                    "ADD COLUMN IF NOT EXISTS embedding vector(384)"
                )
            )
            await conn.execute(
                text(
                    "ALTER TABLE resumes "
                    "ADD COLUMN IF NOT EXISTS embedding vector(384)"
                )
            )
            # Structured profile extras (JSON) — idempotent.
            for col in ("education", "experience", "certificates"):
                await conn.execute(
                    text(
                        f"ALTER TABLE student_profiles "
                        f"ADD COLUMN IF NOT EXISTS {col} JSON"
                    )
                )
        logger.info("✅ pgvector extension and embedding/profile columns ensured.")

    yield
    logger.info(f"🛑 Shutting down {settings.APP_NAME}")
    await engine.dispose()


# ── Application Factory ───────────────────────────────────────


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "**InternMatch AI** – AI-powered internship recommendation platform "
            "for the PM Internship Scheme.\n\n"
            "Upload your resume, extract skills, check eligibility, and receive "
            "personalised recommendations powered by Sentence Transformers and LightGBM."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        contact={
            "name": "InternMatch AI Team",
            "email": "support@internmatch.ai",
        },
        license_info={"name": "MIT"},
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_allowed_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request Timing Middleware ──────────────────────────────
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1000
        response.headers["X-Process-Time-Ms"] = f"{elapsed:.2f}"
        return response

    # ── Global Exception Handlers ─────────────────────────────
    @app.exception_handler(InternMatchError)
    async def internmatch_error_handler(request: Request, exc: InternMatchError):
        logger.warning(f"Domain error on {request.url}: {exc}")
        return JSONResponse(
            status_code=400,
            content={"error": type(exc).__name__, "detail": str(exc)},
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled error on {request.url}: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "detail": "An unexpected error occurred.",
            },
        )

    # ── Routers ───────────────────────────────────────────────
    API_PREFIX = "/api/v1"
    app.include_router(auth_router, prefix=API_PREFIX)
    app.include_router(users_router, prefix=API_PREFIX)
    app.include_router(resumes_router, prefix=API_PREFIX)
    app.include_router(internships_router, prefix=API_PREFIX)
    app.include_router(recommendations_router, prefix=API_PREFIX)
    app.include_router(applications_router, prefix=API_PREFIX)
    app.include_router(saved_router, prefix=API_PREFIX)
    app.include_router(notifications_router, prefix=API_PREFIX)
    app.include_router(profile_router, prefix=API_PREFIX)
    app.include_router(chat_router, prefix=API_PREFIX)

    # ── Health Check ──────────────────────────────────────────
    @app.get("/health", tags=["Health"], summary="Health check")
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @app.get("/", tags=["Root"], include_in_schema=False)
    async def root():
        return {
            "message": f"Welcome to {settings.APP_NAME}",
            "docs": "/docs",
            "health": "/health",
        }

    return app


app = create_application()
