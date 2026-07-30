"""
AI Career Assistant (Phase 3) — a RAG chatbot powered by free Google Gemini.

For each turn we retrieve grounding data — internships (via pgvector semantic
search on the question), the student's profile and their applications — and ask
Gemini to answer using only that data. This keeps answers grounded and free.
"""

import json
from typing import List, Literal, Optional

from loguru import logger
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import CurrentUser
from app.core.exceptions import http_400
from app.database import get_db
from app.models.application import Application
from app.models.internship import Internship
from app.models.resume import Resume, ResumeSkill
from app.models.skill import Skill
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.services.embeddings import embed_one

router = APIRouter(prefix="/chat", tags=["AI Assistant"])


# ── Schemas ───────────────────────────────────────────────────


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1)


class ChatInternship(BaseModel):
    id: str
    title: str
    company: str
    match: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    internships: List[ChatInternship] = []


SYSTEM_PROMPT = (
    "You are InternMatch AI's friendly career assistant for students seeking "
    "government, PSU and PM Internship Scheme internships in India. Help them "
    "discover internships, understand how well they fit, improve their skills, "
    "and navigate applications.\n\n"
    "Answer ONLY using the DATA provided below. Never invent internships, "
    "application statuses, or skills. When you recommend internships, name the "
    "company and briefly say why it fits. Be concise, warm and practical. If the "
    "student has no resume, gently suggest uploading one for better matches. "
    "Keep answers short (2-4 sentences) unless asked for detail."
)

# Words that signal the user wants internship suggestions (drives ref cards).
SEARCH_HINTS = (
    "intern",
    "role",
    "job",
    "opportunit",
    "find",
    "suggest",
    "recommend",
    "match",
    "fit",
    "remote",
    "sector",
    "company",
    "vacan",
    "position",
    "apply",
    "career",
    "work",
)


# ── Retrieval helpers ─────────────────────────────────────────


async def _retrieve_internships(query: str, db: AsyncSession, limit: int = 6):
    vec = await embed_one(query)
    if not vec:
        return [], []
    stmt = (
        select(
            Internship,
            (1 - Internship.embedding.cosine_distance(vec)).label("sim"),
        )
        .where(Internship.is_active.is_(True), Internship.embedding.isnot(None))
        .order_by(Internship.embedding.cosine_distance(vec))
        .limit(limit)
    )
    rows = (await db.execute(stmt)).all()
    context, refs = [], []
    for intern, sim in rows:
        match = round(max(0.0, float(sim)) * 100)
        context.append(
            {
                "id": str(intern.id),
                "title": intern.title,
                "company": intern.company,
                "sector": intern.sector,
                "location": (
                    "Remote" if intern.is_remote else (intern.location or "India")
                ),
                "stipend": (
                    float(intern.stipend_amount)
                    if intern.stipend_amount is not None
                    else None
                ),
                "match_percent": match,
            }
        )
        refs.append(
            {
                "id": str(intern.id),
                "title": intern.title,
                "company": intern.company,
                "match": match,
            }
        )
    return context, refs


async def _profile_context(user: User, db: AsyncSession) -> dict:
    resume = (
        (
            await db.execute(
                select(Resume)
                .where(Resume.user_id == user.id, Resume.is_active.is_(True))
                .order_by(Resume.created_at.desc())
            )
        )
        .scalars()
        .first()
    )
    skills: List[str] = []
    if resume:
        skills = list(
            (
                await db.execute(
                    select(Skill.name)
                    .join(ResumeSkill, ResumeSkill.skill_id == Skill.id)
                    .where(ResumeSkill.resume_id == resume.id)
                )
            )
            .scalars()
            .all()
        )
    profile = (
        await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == user.id)
        )
    ).scalar_one_or_none()
    return {
        "name": user.full_name,
        "has_resume": resume is not None,
        "skills": skills,
        "degree": profile.degree if profile else None,
        "major": profile.major if profile else None,
        "gpa": profile.gpa if profile else None,
    }


async def _applications_context(user: User, db: AsyncSession) -> list:
    apps = (
        (
            await db.execute(
                select(Application)
                .where(Application.user_id == user.id)
                .options(selectinload(Application.internship))
                .order_by(Application.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [
        {
            "internship": a.internship.title if a.internship else "Internship",
            "company": a.internship.company if a.internship else None,
            "status": a.status.lower(),
        }
        for a in apps
    ]


# ── Endpoint ──────────────────────────────────────────────────


@router.post(
    "/", response_model=ChatResponse, summary="Chat with the AI career assistant"
)
async def chat(
    payload: ChatRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    if not settings.GEMINI_API_KEY:
        raise http_400("The AI assistant isn't configured on the server yet.")

    # Latest user message drives retrieval.
    latest_user = ""
    for m in reversed(payload.messages):
        if m.role == "user":
            latest_user = m.content
            break

    internships_ctx, refs = await _retrieve_internships(latest_user, db)
    profile_ctx = await _profile_context(current_user, db)
    apps_ctx = await _applications_context(current_user, db)

    data_block = (
        "DATA (use only this to answer):\n"
        f"STUDENT_PROFILE = {json.dumps(profile_ctx, default=str)}\n"
        f"STUDENT_APPLICATIONS = {json.dumps(apps_ctx, default=str)}\n"
        f"RELEVANT_INTERNSHIPS = {json.dumps(internships_ctx, default=str)}\n"
    )
    system_text = f"{SYSTEM_PROMPT}\n\n{data_block}"

    # Build Gemini conversation (roles: user / model), starting with a user turn.
    history = payload.messages[-12:]
    while history and history[0].role != "user":
        history = history[1:]
    contents = [
        {
            "role": "user" if m.role == "user" else "model",
            "parts": [{"text": m.content}],
        }
        for m in history
    ]
    if not contents:
        contents = [{"role": "user", "parts": [{"text": latest_user or "Hello"}]}]

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = await client.aio.models.generate_content(
            model=settings.CHAT_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_text,
                temperature=0.5,
                max_output_tokens=800,
            ),
        )
        reply = (response.text or "").strip()
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Gemini chat failed: {exc}")
        raise http_400("The assistant is unavailable right now. Please try again.")

    if not reply:
        reply = "Sorry, I couldn't generate a response. Could you rephrase?"

    show_refs = any(h in latest_user.lower() for h in SEARCH_HINTS)
    internships = (
        [ChatInternship(**r) for r in refs[:4]] if (show_refs and refs) else []
    )
    return ChatResponse(reply=reply, internships=internships)
