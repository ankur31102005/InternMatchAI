"""
One-off backfill: generate semantic embeddings for existing internships and
resumes that don't have one yet (Phase 1).

Self-contained (raw asyncpg + the AI service /embed endpoint) to avoid the
app's import graph. Run inside the backend container:

    docker exec internmatch_backend python embed_backfill.py
"""

import asyncio
import os

import asyncpg
import httpx

BATCH = 64
AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://ai-service:8001")
DATABASE_URL = os.environ["DATABASE_URL"].replace("+asyncpg", "")


async def embed_texts(client: httpx.AsyncClient, texts: list[str]) -> list[list[float]]:
    resp = await client.post(f"{AI_SERVICE_URL}/embed", json={"texts": texts})
    resp.raise_for_status()
    return resp.json().get("embeddings", [])


def vec_literal(vec: list[float]) -> str:
    return "[" + ",".join(str(x) for x in vec) + "]"


async def backfill_internships(conn, client) -> None:
    rows = await conn.fetch(
        """
        SELECT i.id,
               i.title, i.company, i.sector, i.ministry, i.description,
               COALESCE(
                 array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '{}'
               ) AS skills
        FROM internships i
        LEFT JOIN internship_skills isk ON isk.internship_id = i.id
        LEFT JOIN skills s ON s.id = isk.skill_id
        WHERE i.embedding IS NULL
        GROUP BY i.id
        """
    )
    print(f"[internships] to embed: {len(rows)}")

    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        texts = []
        for r in chunk:
            parts = [r["title"] or "", r["company"] or ""]
            if r["sector"]:
                parts.append(r["sector"])
            if r["ministry"]:
                parts.append(r["ministry"])
            if r["description"]:
                parts.append(r["description"])
            if r["skills"]:
                parts.append("Required skills: " + ", ".join(r["skills"]))
            texts.append(" | ".join(p for p in parts if p))

        vectors = await embed_texts(client, texts)
        if len(vectors) != len(chunk):
            print(f"  batch {i}: embed failed (got {len(vectors)}) — skipping")
            continue

        await conn.executemany(
            "UPDATE internships SET embedding = $1::vector WHERE id = $2",
            [(vec_literal(v), r["id"]) for r, v in zip(chunk, vectors)],
        )
        print(f"  embedded {min(i + BATCH, len(rows))}/{len(rows)}")


async def backfill_resumes(conn, client) -> None:
    rows = await conn.fetch(
        "SELECT id, extracted_text FROM resumes "
        "WHERE embedding IS NULL AND extracted_text IS NOT NULL"
    )
    print(f"[resumes] to embed: {len(rows)}")

    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        texts = [r["extracted_text"] or "" for r in chunk]
        vectors = await embed_texts(client, texts)
        if len(vectors) != len(chunk):
            print(f"  batch {i}: embed failed — skipping")
            continue
        await conn.executemany(
            "UPDATE resumes SET embedding = $1::vector WHERE id = $2",
            [(vec_literal(v), r["id"]) for r, v in zip(chunk, vectors)],
        )
        print(f"  embedded {min(i + BATCH, len(rows))}/{len(rows)}")


async def main() -> None:
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            await backfill_internships(conn, client)
            await backfill_resumes(conn, client)
    finally:
        await conn.close()
    print("Backfill complete.")


if __name__ == "__main__":
    asyncio.run(main())
