"""
AI Service – FastAPI Application.
Responsible for:
1. Extracting skills from resumes (Sentence Transformers / keyword models).
2. Generating match scores (semantic search + LightGBM ranker).
3. Providing model explanations (SHAP feature importances).
"""

from contextlib import asynccontextmanager
from typing import List, Optional
import uuid

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from loguru import logger


# ── Lifespan / Startup ────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Service...")
    # Initialize sentence-transformers and pre-load models here if needed.
    yield
    logger.info("Stopping AI Service...")


app = FastAPI(
    title="InternMatch AI - AI Service",
    version="1.0.0",
    description="Microservice for resume parsing, embedding generation, and ranking recommendations.",
    lifespan=lifespan,
)


# ── Schemas ───────────────────────────────────────────────────

class SkillExtractRequest(BaseModel):
    text: str = Field(..., description="Raw text extracted from the resume")


class ExtractedSkill(BaseModel):
    name: str
    category: Optional[str] = None
    confidence: float


class SkillExtractResponse(BaseModel):
    skills: List[ExtractedSkill]


class CandidateFeature(BaseModel):
    gpa: float
    skills: List[str]
    degree: str
    major: str


class InternshipFeature(BaseModel):
    id: uuid.UUID
    min_gpa: float
    required_skills: List[str]
    required_degree: str


class RankRequest(BaseModel):
    candidate: CandidateFeature
    internships: List[InternshipFeature]


class MatchExplanation(BaseModel):
    shap_values: dict = Field(..., description="Feature impact scores")
    text_summary: str


class InternshipRankResult(BaseModel):
    internship_id: uuid.UUID
    match_score: float
    explanation: MatchExplanation


class RankResponse(BaseModel):
    results: List[InternshipRankResult]


# ── API Endpoints ─────────────────────────────────────────────

@app.post("/extract-skills", response_model=SkillExtractResponse)
async def extract_skills(payload: SkillExtractRequest):
    """
    Extract skills from the resume text.
    Uses Sentence Transformers to match text snippets to a known skill taxonomy.
    """
    logger.info("Extracting skills from text...")
    # Scaffold response
    dummy_skills = [
        {"name": "Python", "category": "Programming Languages", "confidence": 0.98},
        {"name": "Data Analysis", "category": "Data Science", "confidence": 0.89},
        {"name": "SQL", "category": "Databases", "confidence": 0.75},
    ]
    return {"skills": dummy_skills}


@app.post("/rank-internships", response_model=RankResponse)
async def rank_internships(payload: RankRequest):
    """
    Calculate compatibility scores between a candidate profile and a list of internships.
    Utilises LightGBM for ranking and SHAP for explanation.
    """
    logger.info(f"Ranking {len(payload.internships)} internships for candidate...")
    
    results = []
    for i, intern in enumerate(payload.internships):
        # Scaffold rating and explanation logic
        score = 0.85 - (i * 0.1) # dummy score
        explanation = MatchExplanation(
            shap_values={
                "gpa_match": 0.15,
                "skills_overlap": 0.45,
                "degree_alignment": 0.20
            },
            text_summary="High overlap in required skills (Python, SQL) and GPA eligibility criteria met."
        )
        results.append(
            InternshipRankResult(
                internship_id=intern.id,
                match_score=max(0.1, min(score, 1.0)),
                explanation=explanation
            )
        )
        
    return {"results": results}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}
