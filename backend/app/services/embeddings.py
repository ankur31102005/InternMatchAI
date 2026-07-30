"""
Embedding service — Phase 1 semantic matching.

Calls the AI service `/embed` endpoint (sentence-transformers, 384-dim) to
convert text into vectors that are stored in pgvector columns and compared with
cosine similarity.
"""

from typing import List, Optional

import httpx
from loguru import logger

from app.config import settings

EMBEDDING_DIM = 384


async def embed_texts(texts: List[str]) -> List[List[float]]:
    """Return a list of embedding vectors for the given texts (empty on failure)."""
    if not texts:
        return []
    url = f"{settings.AI_SERVICE_URL}/embed"
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json={"texts": texts})
            resp.raise_for_status()
            data = resp.json()
        return data.get("embeddings", [])
    except Exception as exc:  # noqa: BLE001 – degrade gracefully
        logger.error(f"Embedding service call failed: {exc}")
        return []


async def embed_one(text: str) -> Optional[List[float]]:
    """Embed a single text; returns None on failure."""
    text = (text or "").strip()
    if not text:
        return None
    vectors = await embed_texts([text])
    return vectors[0] if vectors else None


def internship_to_text(internship) -> str:
    """Build a rich text representation of an internship for embedding.

    Skills are included when the `internship_skills` relationship is loaded.
    """
    parts: List[str] = [internship.title or "", internship.company or ""]
    if internship.sector:
        parts.append(str(internship.sector))
    if internship.ministry:
        parts.append(str(internship.ministry))
    if internship.description:
        parts.append(str(internship.description))
    try:
        skills = [
            link.skill.name
            for link in getattr(internship, "internship_skills", [])
            if getattr(link, "skill", None)
        ]
        if skills:
            parts.append("Required skills: " + ", ".join(skills))
    except Exception:  # noqa: BLE001 – relationship may not be loaded
        pass
    return " | ".join(p for p in parts if p)
