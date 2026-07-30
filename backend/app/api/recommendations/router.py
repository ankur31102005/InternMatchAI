"""
Recommendations API routes – AI-powered recommendation engine integration.
"""

import json
import httpx
from loguru import logger
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.internship import Internship, InternshipSkill
from app.models.recommendation import Recommendation
from app.models.resume import Resume, ResumeSkill
from app.models.skill import Skill
from app.models.student_profile import StudentProfile
from app.schemas.recommendation import (
    RecommendationListResponse,
    RecommendationResponse,
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get(
    "/",
    response_model=RecommendationListResponse,
    summary="Get AI-powered internship recommendations",
)
async def get_recommendations(
    current_user: CurrentUser,
    limit: int = Query(10, ge=1, le=50, description="Max results to return"),
    db: AsyncSession = Depends(get_db),
) -> RecommendationListResponse:
    """
    Returns personalised internship recommendations for the authenticated user.
    """
    # 1. Fetch user's latest active resume
    stmt_resume = (
        select(Resume)
        .where(Resume.user_id == current_user.id, Resume.is_active.is_(True))
        .order_by(Resume.created_at.desc())
    )
    res_resume = await db.execute(stmt_resume)
    latest_resume = res_resume.scalars().first()

    if not latest_resume:
        # User has no uploaded resume yet
        return RecommendationListResponse(total=0, items=[])

    # 2. Get skills from user's latest resume
    stmt_skills = (
        select(Skill.name)
        .join(ResumeSkill, ResumeSkill.skill_id == Skill.id)
        .where(ResumeSkill.resume_id == latest_resume.id)
    )
    res_skills = await db.execute(stmt_skills)
    user_skills = list(res_skills.scalars().all())

    # 3. Get student profile details
    stmt_prof = select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    res_prof = await db.execute(stmt_prof)
    profile = res_prof.scalar_one_or_none()

    gpa_val = (
        float(profile.gpa)
        if (profile and profile.gpa and profile.gpa.replace(".", "", 1).isdigit())
        else 8.0
    )
    degree_val = (
        profile.degree if (profile and profile.degree) else "Bachelor of Technology"
    )
    major_val = profile.major if (profile and profile.major) else "Computer Science"

    # 4. Fetch all active internships with required skills
    stmt_internships = (
        select(Internship)
        .options(
            selectinload(Internship.internship_skills).selectinload(
                InternshipSkill.skill
            )
        )
        .where(Internship.is_active.is_(True))
    )
    res_internships = await db.execute(stmt_internships)
    internships = list(res_internships.scalars().all())

    if not internships:
        return RecommendationListResponse(total=0, items=[])

    # 5. Format payload for AI Service ranker
    candidate_payload = {
        "gpa": gpa_val,
        "skills": user_skills,
        "degree": degree_val,
        "major": major_val,
    }

    internship_payloads = []
    for intern in internships:
        req_skills = [
            is_obj.skill.name for is_obj in intern.internship_skills if is_obj.skill
        ]
        internship_payloads.append(
            {
                "id": str(intern.id),
                "min_gpa": float(intern.min_gpa) if intern.min_gpa is not None else 0.0,
                "required_skills": req_skills,
                "required_degree": intern.required_degree or "Any",
            }
        )

    rank_request = {
        "candidate": candidate_payload,
        "internships": internship_payloads,
    }

    # 6. Call AI Service rank-internships API
    ai_service_url = f"{settings.AI_SERVICE_URL}/rank-internships"
    rank_results = []
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            ai_resp = await client.post(ai_service_url, json=rank_request)
            ai_resp.raise_for_status()
            rank_data = ai_resp.json()
        rank_results = rank_data.get("results", [])
    except Exception as e:
        logger.error(f"Failed to call AI service for ranking: {e}")
        # Fallback scoring if AI service is unreachable
        for intern in internships:
            req_skills = set(
                is_obj.skill.name.lower()
                for is_obj in intern.internship_skills
                if is_obj.skill
            )
            u_skills = set(s.lower() for s in user_skills)
            matched = req_skills.intersection(u_skills)
            score = (
                round(len(matched) / max(len(req_skills), 1), 2) if req_skills else 0.75
            )
            rank_results.append(
                {
                    "internship_id": str(intern.id),
                    "match_score": score,
                    "explanation": {
                        "text_summary": f"Strong skill alignment with {len(matched)} matching skills.",
                        "shap_values": {"skills_overlap": score},
                    },
                }
            )

    # 6.5 Semantic similarity (Phase 1): embed the resume if needed, then score
    #      every internship by pgvector cosine similarity to the resume vector.
    from app.services.embeddings import embed_one

    if latest_resume.embedding is None and latest_resume.extracted_text:
        resume_vec = await embed_one(latest_resume.extracted_text)
        if resume_vec:
            latest_resume.embedding = resume_vec
            await db.commit()

    semantic_scores: dict[str, float] = {}
    if latest_resume.embedding is not None:
        stmt_sem = select(
            Internship.id,
            (1 - Internship.embedding.cosine_distance(latest_resume.embedding)).label(
                "similarity"
            ),
        ).where(
            Internship.is_active.is_(True),
            Internship.embedding.isnot(None),
        )
        res_sem = await db.execute(stmt_sem)
        for iid, sim in res_sem.all():
            semantic_scores[str(iid)] = max(0.0, float(sim)) if sim is not None else 0.0

    # 7. Blend skill + semantic scores, then save recommendation records
    await db.execute(
        delete(Recommendation).where(Recommendation.user_id == current_user.id)
    )

    # XAI blend (Phase 2): three transparent signals feed the final score —
    # semantic meaning, skill overlap, and eligibility (GPA vs the role's min).
    SEMANTIC_WEIGHT = 0.55
    SKILL_WEIGHT = 0.30
    ELIG_WEIGHT = 0.15

    intern_by_id = {str(i.id): i for i in internships}

    def eligibility_for(intern_obj) -> float:
        if intern_obj is None or intern_obj.min_gpa is None:
            return 1.0
        min_gpa = float(intern_obj.min_gpa)
        if min_gpa <= 0 or gpa_val >= min_gpa:
            return 1.0
        return max(0.3, round(gpa_val / min_gpa, 4))

    scored = []
    for res in rank_results:
        intern_id_str = str(res["internship_id"])
        skill_score = float(res["match_score"])
        sem = semantic_scores.get(intern_id_str)
        sem_eff = sem if sem is not None else skill_score
        elig = eligibility_for(intern_by_id.get(intern_id_str))
        blended = round(
            SEMANTIC_WEIGHT * sem_eff + SKILL_WEIGHT * skill_score + ELIG_WEIGHT * elig,
            4,
        )
        scored.append((intern_id_str, blended, sem, skill_score, elig, res))

    scored.sort(key=lambda x: x[1], reverse=True)
    recommendations_to_add = []

    for idx, (intern_id_str, blended, sem, skill_score, elig, res) in enumerate(scored):
        explanation_dict = res.get("explanation", {})
        shap_vals = (
            explanation_dict.get("shap_values", {})
            if isinstance(explanation_dict, dict)
            else {}
        )

        intern_obj = next((i for i in internships if str(i.id) == intern_id_str), None)
        if not intern_obj:
            continue

        req_skill_names = [
            is_obj.skill.name for is_obj in intern_obj.internship_skills if is_obj.skill
        ]
        user_skill_set = set(s.lower() for s in user_skills)

        matched_skills = [s for s in req_skill_names if s.lower() in user_skill_set]
        missing_skills = [s for s in req_skill_names if s.lower() not in user_skill_set]

        # Explanation reflects both semantic fit and skill overlap.
        sem_pct = int(round((sem if sem is not None else skill_score) * 100))
        if matched_skills:
            text_summary = (
                f"{sem_pct}% semantic fit with your resume. "
                f"Matched {len(matched_skills)} of {len(req_skill_names)} listed "
                f"skills ({', '.join(matched_skills)})."
            )
        elif req_skill_names:
            text_summary = (
                f"{sem_pct}% semantic fit with your resume, though none of the "
                f"{len(req_skill_names)} listed skills are on your resume yet."
            )
        else:
            text_summary = f"{sem_pct}% semantic fit with your resume."

        rec = Recommendation(
            user_id=current_user.id,
            internship_id=intern_obj.id,
            match_score=blended,
            skill_match_score=round(skill_score, 4),
            semantic_score=round(sem, 4) if sem is not None else round(skill_score, 4),
            eligibility_score=round(elig, 4),
            rank=idx + 1,
            explanation=text_summary,
            matched_skills=json.dumps(matched_skills),
            missing_skills=json.dumps(missing_skills),
            shap_values=json.dumps(shap_vals),
            model_version="v2.0.0-semantic",
            is_viewed=False,
            is_dismissed=False,
        )
        recommendations_to_add.append(rec)

    db.add_all(recommendations_to_add)
    await db.commit()

    # 8. Query final recommendations with eager-loaded internship relationship
    stmt_final = (
        select(Recommendation)
        .options(
            selectinload(Recommendation.internship)
            .selectinload(Internship.internship_skills)
            .selectinload(InternshipSkill.skill)
        )
        .where(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.match_score.desc())
        .limit(limit)
    )
    res_final = await db.execute(stmt_final)
    final_items = list(res_final.scalars().all())

    return RecommendationListResponse(
        total=len(final_items),
        items=[RecommendationResponse.model_validate(r) for r in final_items],
    )
