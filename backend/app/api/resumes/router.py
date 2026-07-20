"""
Resume upload and management API routes.
"""

import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import CurrentUser
from app.core.exceptions import http_400, http_404
from app.database import get_db
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ResumeUploadResponse

router = APIRouter(prefix="/resumes", tags=["Resumes"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=201,
    summary="Upload a resume (PDF or DOCX)",
)
async def upload_resume(
    current_user: CurrentUser,
    file: UploadFile = File(..., description="Resume file (PDF or DOCX, max 10MB)"),
    db: AsyncSession = Depends(get_db),
) -> ResumeUploadResponse:
    """
    Upload a student resume.

    - Accepts PDF and DOCX formats.
    - Maximum file size: 10 MB.
    - Triggers async text extraction and skill parsing (scaffolded).
    """
    # Validate extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise http_400(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read content & check size
    content = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise http_400(f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB} MB.")

    # Build upload path
    upload_dir = Path(settings.UPLOAD_DIR) / str(current_user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid.uuid4()}{ext}"
    file_path = upload_dir / stored_filename

    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Create DB record
    resume = Resume(
        user_id=current_user.id,
        filename=stored_filename,
        original_filename=file.filename or stored_filename,
        file_path=str(file_path),
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        is_processed=False,
        is_active=True,
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    logger.info(
        f"Resume uploaded: user={current_user.id} file={stored_filename} size={len(content)}"
    )

    # TODO: Dispatch background task for text extraction & skill parsing

    return ResumeUploadResponse(
        message="Resume uploaded successfully. Processing will begin shortly.",
        resume=ResumeResponse.model_validate(resume),
    )


@router.get(
    "/",
    response_model=list[ResumeResponse],
    summary="List current user's resumes",
)
async def list_my_resumes(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[ResumeResponse]:
    """Return all resumes for the authenticated user."""
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == current_user.id, Resume.is_active == True)  # noqa
        .order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    return [ResumeResponse.model_validate(r) for r in resumes]


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Get a specific resume",
)
async def get_resume(
    resume_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ResumeResponse:
    """Get details of a specific resume. Only accessible by the owner."""
    result = await db.execute(
        select(Resume).where(
            Resume.id == resume_id, Resume.user_id == current_user.id
        )
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise http_404(f"Resume {resume_id} not found.")
    return ResumeResponse.model_validate(resume)


@router.delete(
    "/{resume_id}",
    status_code=204,
    summary="Delete a resume",
)
async def delete_resume(
    resume_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete a resume (marks as inactive)."""
    result = await db.execute(
        select(Resume).where(
            Resume.id == resume_id, Resume.user_id == current_user.id
        )
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise http_404(f"Resume {resume_id} not found.")

    resume.is_active = False
    await db.commit()
    logger.info(f"Resume soft-deleted: {resume_id} by user {current_user.id}")
