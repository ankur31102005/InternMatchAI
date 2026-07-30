# InternMatch AI — Advanced AI Roadmap (DL · NLP · XAI · Agentic · RAG)

A phased plan to turn "InternMatch **AI**" from keyword matching into a genuinely
AI-powered platform. Every phase is designed to run on **free-tier hosting** by
using **hosted APIs** instead of self-hosted heavy models.

---

## Guiding principles

1. **API-first, not self-hosted.** Real deep-learning models (torch,
   sentence-transformers) are too heavy for Render's free tier. Use hosted APIs
   for the LLM and embeddings — same approach modern production apps use.
2. **pgvector is already enabled** in the database → we can store embeddings and
   do semantic search with zero new infrastructure.
3. **Right model for the job** (cost-aware):
   | Task | Recommended model | Why |
   |------|-------------------|-----|
   | High-volume extraction (resume parsing, skill tagging) | `claude-haiku-4-5` ($1 / $5 per 1M tok) | Cheapest, fast, plenty smart for extraction |
   | Chatbot / agentic assistant | `claude-sonnet-5` ($3 / $15; intro $2 / $10 through 2026-08-31) | Near-Opus quality at lower cost |
   | Hardest reasoning (optional) | `claude-opus-5` ($5 / $25) | Most capable |
   > Anthropic's default is `claude-opus-5`; for a student project the Haiku/Sonnet
   > mix keeps cost to a few dollars total.
4. **Embeddings need a separate provider** — **the Claude API has no embeddings
   endpoint.** Options: **Voyage AI** (`voyage-3.5`, Anthropic's recommended
   embeddings partner, has a free tier) or **OpenAI** (`text-embedding-3-small`).
   Both are cheap and API-based (no heavy model to host).

---

## Prerequisites (Phase 0 — Foundation)

- [ ] Get an **Anthropic API key** → `platform.claude.com` → add as backend env
      `ANTHROPIC_API_KEY` (backend only — **never** expose in the frontend).
- [ ] Get an **embeddings key** (Voyage `VOYAGE_API_KEY` or OpenAI `OPENAI_API_KEY`).
- [ ] Add backend deps: `anthropic`, plus `voyageai` **or** `openai` (embeddings client).
- [ ] pgvector: already `CREATE EXTENSION vector` — no action.
- [ ] DB migration: add an `embedding vector(1024)` column to `internships`
      (dimension = the embedding model's size, e.g. voyage-3.5 = 1024) and a place
      to store the resume/user embedding.

> **Architecture note:** put embedding + LLM logic in the **backend** (it has DB
> access and `httpx`). The existing `ai-service` can stay as-is or be retired.

---

## Phase 1 — DL: Semantic matching (embeddings + pgvector) 🥇

**Goal:** rank internships by *meaning*, not keyword overlap.

1. On internship create/import → embed `title + description + skills` → store in
   `internships.embedding`.
2. On resume upload → embed the extracted resume text → store the user embedding.
3. Recommendation query = pgvector **cosine similarity** between the user
   embedding and all internship embeddings, ordered by distance:
   ```sql
   SELECT id, 1 - (embedding <=> :user_vec) AS score
   FROM internships WHERE is_active = true
   ORDER BY embedding <=> :user_vec LIMIT 20;
   ```
4. **Backfill** the existing 2,233 internships once (a script that embeds each and
   fills the column).

**Effort:** Medium · **Cost:** embeddings ≈ a few cents for the backfill + per new item.
**Deliverable:** recommendations that actually understand the resume.

---

## Phase 2 — NLP + XAI: smart resume parsing + explainable match 🥈

**Goal:** better skill extraction, and a clear "why" for every match.

1. **NLP (resume parsing):** send resume text to `claude-haiku-4-5` with a
   structured-output schema → extract normalized `skills`, `experience`,
   `education`, `domains`. Replaces the current keyword matcher.
2. **XAI (explainable match):** combine three signals into the final score —
   semantic similarity (Phase 1) + skill overlap + eligibility — and show the
   breakdown as bars. Then ask Claude for a one-paragraph natural-language reason
   ("You're a strong fit because …; to improve, learn …").
3. **UI:** the recommendation page already renders matched/missing skills + a
   score ring — add the score-component breakdown and the AI explanation.

**Effort:** Small–Medium · **Cost:** 1 cheap LLM call per resume + per match explanation.
**Deliverable:** trustworthy, transparent recommendations.

---

## Phase 3 — RAG + Agentic: AI Career Assistant chatbot 🥉 (biggest "wow")

**Goal:** a chat assistant that answers grounded questions and helps end-to-end.

1. **RAG:** user question → embed it → pgvector retrieve the most relevant
   internships (+ the user's profile/skills) → pass as context to Claude →
   grounded answer with real internship references (no hallucination).
2. **Agentic (tool use):** give Claude tools it can call in a loop
   (`anthropic` SDK tool runner or a manual loop):
   - `search_internships(query, filters)` → pgvector search
   - `get_my_profile()` → the user's skills/applications
   - `analyze_skill_gap(internship_id)` → matched/missing skills
   - `draft_cover_letter(internship_id)` → generated draft
3. **Frontend:** a floating chat widget (streaming responses).

**Effort:** Large · **Cost:** per-conversation tokens on Sonnet/Haiku (use prompt
caching for the system prompt to cut cost ~90%).
**Deliverable:** one feature that showcases RAG + agentic + NLP + XAI together —
ideal for a demo or hackathon.

---

## Cross-cutting concerns

- **Cost control:** prompt caching (frozen system prompt), per-user rate limits,
  cheapest-model-that-works per task, `max_tokens` caps.
- **Safety:** handle `stop_reason == "refusal"`, stream long chat responses.
- **Keys stay server-side:** all Anthropic/embeddings calls happen in the backend;
  the frontend only talks to your own API.

---

## Deployment (all phases)

- Everything is API-based → **works on the current free-tier setup** (no heavy
  model to host).
- Add `ANTHROPIC_API_KEY` + `VOYAGE_API_KEY`/`OPENAI_API_KEY` to the **Render
  backend** env (recreate the service to load env — `docker compose up -d backend`
  locally). Never put these in Vercel/frontend.
- pgvector already enabled on the DB.

## Rough cost estimate (student-scale demo)

| Item | Approx cost |
|------|-------------|
| Embed 2,233 internships (backfill, one-time) | < $0.10 |
| Per resume parse + embed | fractions of a cent |
| Chatbot usage (demo) | a few dollars total |

---

## Recommended build order

1. **Phase 1** (semantic matching) — foundation; makes "AI" real.
2. **Phase 2** (NLP + XAI) — quality + trust.
3. **Phase 3** (RAG + agentic chatbot) — the showcase feature.

Each phase is independently shippable. Start with Phase 1.
