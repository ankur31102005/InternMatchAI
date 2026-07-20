# InternMatch AI - Implementation Plan

## Structure Overview

### Root Files
- docker-compose.yml
- .gitignore
- README.md

### Backend (FastAPI + PostgreSQL)
- Full JWT auth (register/login/me)
- SQLAlchemy models for all tables
- Repository pattern
- Pydantic v2 schemas
- Alembic migrations
- Swagger UI

### Frontend (Next.js 15 + TypeScript)
- App Router
- Tailwind + shadcn/ui
- Zustand store
- TanStack Query
- React Hook Form + Zod

### AI Service (scaffold only)
- Sentence Transformers scaffold
- Dummy recommendation endpoint

### Database
- PostgreSQL init scripts
- pgvector extension

### Docker
- Dockerfiles for each service
- GitHub Actions CI/CD
