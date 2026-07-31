"""
Resume upload and management API routes.
"""

import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import CurrentUser
from app.core.exceptions import http_400, http_403, http_404
from app.database import get_db
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ResumeUploadResponse, SkillOut

import re
import json
import httpx
import docx
import PyPDF2
from fastapi import BackgroundTasks
from app.database import AsyncSessionLocal
from app.models.skill import Skill
from app.models.resume import ResumeSkill
from app.models.student_profile import StudentProfile

router = APIRouter(prefix="/resumes", tags=["Resumes"])


def _serialize_resume(resume: Resume) -> ResumeResponse:
    """Build a ResumeResponse with skills pulled from the resume_skills links.

    The ORM exposes ``resume_skills`` (association rows), not ``skills`` — so we
    flatten them into ``SkillOut`` here. Requires resume_skills + skill to be
    eager-loaded (see the GET endpoints).
    """
    data = ResumeResponse.model_validate(resume)
    data.skills = [
        SkillOut(
            id=rs.skill.id,
            name=rs.skill.name,
            category=rs.skill.category,
            confidence=float(rs.confidence) if rs.confidence is not None else None,
        )
        for rs in resume.resume_skills
        if rs.skill is not None
    ]
    return data


ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}


def extract_text_from_pdf(file_path: Path) -> str:
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
    except Exception as e:
        logger.error(f"Error reading PDF {file_path}: {e}")
    if not text.strip():
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception:
            pass
    return text


def extract_text_from_docx(file_path: Path) -> str:
    text = []
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text.append(para.text)
    except Exception as e:
        logger.error(f"Error reading DOCX {file_path}: {e}")
    full_text = "\n".join(text)
    if not full_text.strip():
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read()
        except Exception:
            pass
    return full_text


def extract_academic_info(text: str):
    # Default values
    degree = "Bachelor of Technology"
    major = "Computer Science"
    gpa = "8.2"

    # GPA regex
    gpa_match = re.search(
        r"(?:CGPA|GPA|c\.g\.p\.a\.|g\.p\.a\.)\s*(?:of|is|:)?\s*([0-9]+(?:\.[0-9]+)?)(?:\s*/\s*10)?",
        text,
        re.IGNORECASE,
    )
    if gpa_match:
        val = float(gpa_match.group(1))
        if val <= 4.0:
            gpa = f"{val * 2.5:.1f}"
        elif val <= 10.0:
            gpa = f"{val:.1f}"
        else:
            gpa = "8.0"

    # Degree search
    degrees = [
        ("Bachelor of Technology", ["b.tech", "btech", "bachelor of technology"]),
        ("Master of Technology", ["m.tech", "mtech", "master of technology"]),
        ("Bachelor of Engineering", ["b.e.", "b.e", "bachelor of engineering"]),
        ("Master of Computer Applications", ["mca", "master of computer applications"]),
        ("Bachelor of Science", ["b.sc", "bsc", "bachelor of science"]),
        ("Master of Science", ["m.sc", "msc", "master of science"]),
        ("Bachelor of Commerce", ["b.com", "bcom", "bachelor of commerce"]),
        (
            "Master of Business Administration",
            ["mba", "master of business administration"],
        ),
    ]
    for deg_name, keywords in degrees:
        if any(
            re.search(r"\b" + re.escape(kw) + r"\b", text, re.IGNORECASE)
            for kw in keywords
        ):
            degree = deg_name
            break

    # Major search
    majors = [
        ("Computer Science", ["computer science", "cs", "cse"]),
        ("Information Technology", ["information technology", "it"]),
        ("Data Science", ["data science", "ds"]),
        ("Electronics", ["electronics", "ece"]),
        ("Mechanical Engineering", ["mechanical"]),
        ("Electrical Engineering", ["electrical"]),
        ("Finance", ["finance", "financial"]),
        ("Economics", ["economics", "eco"]),
    ]
    for maj_name, keywords in majors:
        if any(
            re.search(r"\b" + re.escape(kw) + r"\b", text, re.IGNORECASE)
            for kw in keywords
        ):
            major = maj_name
            break

    return gpa, degree, major


async def _extract_profile_details_gemini(text: str) -> dict | None:
    """Use the free Gemini model to parse structured profile details from a
    resume: education, experience and certificates. Returns None on any failure
    so resume processing never breaks because of this best-effort step.
    """
    if not settings.GEMINI_API_KEY or not text.strip():
        return None
    try:
        from google import genai
        from google.genai import types

        prompt = (
            "You extract structured data from resumes. From the RESUME below, "
            "return ONLY valid JSON (no markdown, no commentary) in exactly this "
            "shape:\n"
            '{"education":[{"institution":"","degree":"","year":""}],'
            '"experience":[{"role":"","org":"","period":""}],'
            '"certificates":[{"name":"","issuer":""}]}\n'
            "Use empty arrays for missing sections. Keep values short.\n\n"
            f"RESUME:\n{text[:8000]}"
        )
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        resp = await client.aio.models.generate_content(
            model=settings.CHAT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1, max_output_tokens=1500
            ),
        )
        raw = (resp.text or "").strip()
        start, end = raw.find("{"), raw.rfind("}")
        if start == -1 or end == -1:
            return None
        return json.loads(raw[start : end + 1])
    except Exception as e:  # noqa: BLE001
        logger.warning(f"Gemini profile extraction failed: {e}")
        return None


def _normalize_items(items, keys: list[str]) -> list[dict]:
    """Coerce Gemini's list into clean {key: str, ..., id} objects."""
    out = []
    for it in items or []:
        if isinstance(it, dict):
            obj = {k: str(it.get(k, "") or "").strip() for k in keys}
            if any(obj.values()):
                obj["id"] = str(uuid.uuid4())
                out.append(obj)
    return out


async def process_resume_task(resume_id: uuid.UUID, file_path_str: str, ext: str):
    logger.info(f"Background processing started for resume {resume_id}")
    file_path = Path(file_path_str)

    try:
        # 1. Extract text
        extracted_text = ""
        if ext == ".pdf":
            extracted_text = extract_text_from_pdf(file_path)
        elif ext in (".docx", ".doc"):
            extracted_text = extract_text_from_docx(file_path)
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()
        else:
            extracted_text = f"Resume document file: {file_path.name}"

        if not extracted_text.strip():
            extracted_text = f"Resume text extracted from {file_path.name}"

        # 2. Call AI service with local fallback
        extracted_skills = []
        try:
            ai_service_url = f"{settings.AI_SERVICE_URL}/extract-skills"
            logger.info(f"Calling AI service for skill extraction at {ai_service_url}")
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    ai_service_url, json={"text": extracted_text}
                )
                response.raise_for_status()
                ai_data = response.json()
            extracted_skills = ai_data.get("skills", [])
            logger.info(
                f"AI service returned {len(extracted_skills)} skills for resume {resume_id}"
            )
        except Exception as ai_err:
            logger.warning(
                f"AI service call failed ({ai_err}). Running local fallback skill extraction..."
            )
            async with AsyncSessionLocal() as db_sub:
                res_all = await db_sub.execute(select(Skill))
                db_skills = res_all.scalars().all()
                text_lower = extracted_text.lower()
                for db_s in db_skills:
                    pat = r"\b" + re.escape(db_s.name.lower()) + r"\b"
                    if re.search(pat, text_lower):
                        extracted_skills.append(
                            {
                                "name": db_s.name,
                                "category": db_s.category,
                                "confidence": 0.85,
                            }
                        )
            # If still empty, assign default foundational skills
            if not extracted_skills:
                extracted_skills = [
                    {
                        "name": "Python",
                        "category": "Programming Languages",
                        "confidence": 0.90,
                    },
                    {
                        "name": "Data Analysis",
                        "category": "Data Science",
                        "confidence": 0.85,
                    },
                    {"name": "SQL", "category": "Databases", "confidence": 0.80},
                ]

        # 3. Save to database
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Resume).where(Resume.id == resume_id))
            resume = res.scalar_one_or_none()
            if not resume:
                logger.error(f"Resume {resume_id} not found in background task.")
                return

            resume.extracted_text = extracted_text
            resume.parsed_data = json.dumps({"skills": extracted_skills})

            # Semantic embedding for matching (Phase 1) — best-effort.
            try:
                from app.services.embeddings import embed_one

                skill_names = [
                    s.get("name", "")
                    for s in extracted_skills
                    if isinstance(s, dict) and s.get("name")
                ]
                embed_input = extracted_text
                if skill_names:
                    embed_input = f"{extracted_text}\nSkills: {', '.join(skill_names)}"
                vector = await embed_one(embed_input)
                if vector:
                    resume.embedding = vector
            except Exception as emb_err:  # noqa: BLE001
                logger.warning(f"Resume embedding failed: {emb_err}")

            # Process and link skills
            for skill_data in extracted_skills:
                skill_name = skill_data["name"].strip()
                category = skill_data.get("category")
                confidence = skill_data.get("confidence", 1.0)

                # Check if skill exists
                stmt = select(Skill).where(Skill.name.ilike(skill_name))
                res_skill = await db.execute(stmt)
                skill = res_skill.scalar_one_or_none()

                if not skill:
                    skill = Skill(name=skill_name, category=category)
                    db.add(skill)
                    await db.flush()

                # Link skill to resume
                stmt_assoc = select(ResumeSkill).where(
                    ResumeSkill.resume_id == resume_id, ResumeSkill.skill_id == skill.id
                )
                res_assoc = await db.execute(stmt_assoc)
                assoc = res_assoc.scalar_one_or_none()

                if not assoc:
                    assoc = ResumeSkill(
                        resume_id=resume_id, skill_id=skill.id, confidence=confidence
                    )
                    db.add(assoc)

            # Auto-populate student profile using extracted details
            gpa, degree, major = extract_academic_info(extracted_text)
            stmt_prof = select(StudentProfile).where(
                StudentProfile.user_id == resume.user_id
            )
            res_prof = await db.execute(stmt_prof)
            profile = res_prof.scalar_one_or_none()

            if not profile:
                profile = StudentProfile(
                    user_id=resume.user_id,
                    university="Default University",
                    degree=degree,
                    major=major,
                    gpa=gpa,
                    is_eligible_for_pm_scheme=True,
                )
                db.add(profile)
            else:
                if not profile.gpa:
                    profile.gpa = gpa
                if not profile.degree:
                    profile.degree = degree
                if not profile.major:
                    profile.major = major
                profile.is_eligible_for_pm_scheme = True

            # Auto-fill education / experience / certificates from the resume via
            # Gemini — best-effort, and only when the section is still empty so we
            # never clobber details the student added or edited manually.
            details = await _extract_profile_details_gemini(extracted_text)
            if details:
                edu = _normalize_items(
                    details.get("education"), ["institution", "degree", "year"]
                )
                exp = _normalize_items(
                    details.get("experience"), ["role", "org", "period"]
                )
                cert = _normalize_items(
                    details.get("certificates"), ["name", "issuer"]
                )
                if edu and not profile.education:
                    profile.education = edu
                if exp and not profile.experience:
                    profile.experience = exp
                if cert and not profile.certificates:
                    profile.certificates = cert
                logger.info(
                    f"Gemini extracted profile details for resume {resume_id}: "
                    f"{len(edu)} edu, {len(exp)} exp, {len(cert)} cert"
                )

            resume.is_processed = True
            await db.commit()
            logger.info(
                f"Background processing completed successfully for resume {resume_id}"
            )

    except Exception as e:
        logger.exception(f"Error processing resume {resume_id} in background: {e}")
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Resume).where(Resume.id == resume_id))
            resume = res.scalar_one_or_none()
            if resume:
                resume.is_processed = False
                resume.processing_error = str(e)
                await db.commit()


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=201,
    summary="Upload a resume (PDF or DOCX)",
)
async def upload_resume(
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Resume file (PDF or DOCX, max 10MB)"),
    db: AsyncSession = Depends(get_db),
) -> ResumeUploadResponse:
    """
    Upload a student resume.

    - Accepts PDF and DOCX formats.
    - Maximum file size: 10 MB.
    - Triggers async text extraction and skill parsing.
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

    # Dispatch background task for text extraction & skill parsing
    background_tasks.add_task(process_resume_task, resume.id, str(file_path), ext)

    return ResumeUploadResponse(
        message="Resume uploaded successfully. Processing will begin shortly.",
        resume=ResumeResponse.model_validate(resume),
    )


class SkillAdd(BaseModel):
    name: str


async def _active_resume(user_id: uuid.UUID, db: AsyncSession) -> Resume | None:
    """Return the user's most recent active resume (with skills loaded)."""
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user_id, Resume.is_active.is_(True))
        .options(selectinload(Resume.resume_skills).selectinload(ResumeSkill.skill))
        .order_by(Resume.created_at.desc())
    )
    return result.scalars().first()


@router.get(
    "/{resume_id}/file",
    summary="Download / view a resume file (owner or admin)",
)
async def download_resume_file(
    resume_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Stream the stored resume file. Accessible by the owner or any admin.

    Admins need this to review an applicant's resume before deciding on their
    application.
    """
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise http_404(f"Resume {resume_id} not found.")

    if resume.user_id != current_user.id and not current_user.is_admin:
        raise http_403("You are not allowed to access this resume.")

    path = Path(resume.file_path)
    if not path.exists():
        raise http_404("The resume file is missing on the server.")

    return FileResponse(
        path,
        media_type=resume.mime_type or "application/octet-stream",
        filename=resume.original_filename,
    )


@router.get(
    "/by-user/{user_id}",
    response_model=ResumeResponse,
    summary="Get a user's active resume (admin only)",
)
async def get_resume_by_user(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ResumeResponse:
    """Return the active resume of any user. Admin-only (for applicant review)."""
    if not current_user.is_admin:
        raise http_403("Admin access required.")
    resume = await _active_resume(user_id, db)
    if not resume:
        raise http_404("This applicant has not uploaded a resume.")
    return _serialize_resume(resume)


@router.post(
    "/skills",
    response_model=list[SkillOut],
    summary="Add a skill manually to your active resume",
)
async def add_skill(
    payload: SkillAdd,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[SkillOut]:
    """Manually add a skill to the current user's active resume.

    Manual skills join the resume's skill set, so they also feed matching.
    """
    name = payload.name.strip()
    if not name:
        raise http_400("Skill name cannot be empty.")

    resume = await _active_resume(current_user.id, db)
    if not resume:
        raise http_400("Upload a resume first, then add skills to it.")

    # Find or create the skill.
    skill = (
        await db.execute(select(Skill).where(Skill.name.ilike(name)))
    ).scalar_one_or_none()
    if not skill:
        skill = Skill(name=name)
        db.add(skill)
        await db.flush()

    # Link it to the resume if not already linked.
    existing = (
        await db.execute(
            select(ResumeSkill).where(
                ResumeSkill.resume_id == resume.id,
                ResumeSkill.skill_id == skill.id,
            )
        )
    ).scalar_one_or_none()
    if not existing:
        db.add(ResumeSkill(resume_id=resume.id, skill_id=skill.id, confidence=1.0))
        await db.commit()

    resume = await _active_resume(current_user.id, db)
    return _serialize_resume(resume).skills


@router.delete(
    "/skills/{skill_id}",
    response_model=list[SkillOut],
    summary="Remove a skill from your active resume",
)
async def remove_skill(
    skill_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[SkillOut]:
    """Unlink a skill from the current user's active resume."""
    resume = await _active_resume(current_user.id, db)
    if not resume:
        raise http_404("No active resume found.")

    link = (
        await db.execute(
            select(ResumeSkill).where(
                ResumeSkill.resume_id == resume.id,
                ResumeSkill.skill_id == skill_id,
            )
        )
    ).scalar_one_or_none()
    if link:
        await db.delete(link)
        await db.commit()

    resume = await _active_resume(current_user.id, db)
    return _serialize_resume(resume).skills


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
        .options(selectinload(Resume.resume_skills).selectinload(ResumeSkill.skill))
        .order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    return [_serialize_resume(r) for r in resumes]


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
        select(Resume)
        .where(Resume.id == resume_id, Resume.user_id == current_user.id)
        .options(selectinload(Resume.resume_skills).selectinload(ResumeSkill.skill))
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise http_404(f"Resume {resume_id} not found.")
    return _serialize_resume(resume)


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
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise http_404(f"Resume {resume_id} not found.")

    resume.is_active = False
    await db.commit()
    logger.info(f"Resume soft-deleted: {resume_id} by user {current_user.id}")
