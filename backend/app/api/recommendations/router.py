"""
Recommendations API routes.
Returns dummy data for now – will be replaced by AI scoring engine.
"""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.schemas.recommendation import RecommendationListResponse, RecommendationResponse

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# ── Dummy data ────────────────────────────────────────────────
_DUMMY_RECOMMENDATIONS = [
    {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "internship_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "match_score": 0.92,
        "skill_match_score": 0.88,
        "semantic_score": 0.95,
        "eligibility_score": 1.0,
        "rank": 1,
        "explanation": "Strong match based on Python, data analysis skills, and interest in public policy.",
        "matched_skills": json.dumps(["Python", "Data Analysis", "Communication"]),
        "missing_skills": json.dumps(["SQL", "Power BI"]),
        "model_version": "v0.1.0-scaffold",
        "is_viewed": False,
        "internship": {
            "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            "title": "Data Analyst Intern – Ministry of Finance",
            "company": "Ministry of Finance, Government of India",
            "description": "Work with the economic policy team to analyse budget allocations and generate insights.",
            "location": "New Delhi",
            "is_remote": False,
            "duration_weeks": 8,
            "stipend_amount": 15000,
            "stipend_currency": "INR",
            "is_pm_scheme": True,
            "sector": "Finance",
            "ministry": "Ministry of Finance",
            "is_active": True,
            "seats_filled": 3,
            "total_seats": 10,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "skills": [],
        },
    },
    {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "internship_id": "d4e5f6a7-b8c9-0123-defa-234567890123",
        "match_score": 0.84,
        "skill_match_score": 0.79,
        "semantic_score": 0.88,
        "eligibility_score": 0.90,
        "rank": 2,
        "explanation": "Good match for product management roles with strong analytical background.",
        "matched_skills": json.dumps(["Product Thinking", "Agile", "User Research"]),
        "missing_skills": json.dumps(["JIRA", "Roadmapping"]),
        "model_version": "v0.1.0-scaffold",
        "is_viewed": False,
        "internship": {
            "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
            "title": "Product Management Intern – NITI Aayog",
            "company": "NITI Aayog",
            "description": "Assist in digital transformation initiatives and product strategy for government platforms.",
            "location": "New Delhi",
            "is_remote": True,
            "duration_weeks": 12,
            "stipend_amount": 20000,
            "stipend_currency": "INR",
            "is_pm_scheme": True,
            "sector": "Technology",
            "ministry": "NITI Aayog",
            "is_active": True,
            "seats_filled": 1,
            "total_seats": 5,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "skills": [],
        },
    },
    {
        "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
        "internship_id": "f6a7b8c9-d0e1-2345-fab1-456789012345",
        "match_score": 0.76,
        "skill_match_score": 0.73,
        "semantic_score": 0.79,
        "eligibility_score": 0.80,
        "rank": 3,
        "explanation": "Moderate match – consider improving your SQL and data visualisation skills.",
        "matched_skills": json.dumps(["Communication", "Research", "Excel"]),
        "missing_skills": json.dumps(["SQL", "Tableau", "Python"]),
        "model_version": "v0.1.0-scaffold",
        "is_viewed": False,
        "internship": {
            "id": "f6a7b8c9-d0e1-2345-fab1-456789012345",
            "title": "Policy Research Intern – MEA",
            "company": "Ministry of External Affairs",
            "description": "Research and analyse international trade policies and prepare policy briefs.",
            "location": "New Delhi",
            "is_remote": False,
            "duration_weeks": 6,
            "stipend_amount": 10000,
            "stipend_currency": "INR",
            "is_pm_scheme": True,
            "sector": "Policy",
            "ministry": "Ministry of External Affairs",
            "is_active": True,
            "seats_filled": 0,
            "total_seats": 8,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "skills": [],
        },
    },
]


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

    **Note**: This endpoint currently returns scaffold/dummy data.
    The full AI recommendation engine (Sentence Transformers + LightGBM) will be
    integrated in a subsequent milestone.

    Each recommendation includes:
    - `match_score`: Overall match (0–1)
    - `explanation`: Human-readable reason for the match
    - `matched_skills`: Skills you have that match the role
    - `missing_skills`: Skills that could improve your match score
    """
    # Inject user_id into dummy data
    items = []
    for i, rec_data in enumerate(_DUMMY_RECOMMENDATIONS[:limit]):
        rec = dict(rec_data)
        rec["user_id"] = str(current_user.id)
        rec["created_at"] = datetime.now(timezone.utc).isoformat()
        items.append(rec)

    return RecommendationListResponse(total=len(items), items=items)
