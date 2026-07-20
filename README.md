# InternMatch AI 🚀

> **AI-powered internship recommendation platform for the PM Internship Scheme**

InternMatch AI helps students find the best internships by analysing their resumes with AI, extracting skills, checking eligibility, and recommending matching opportunities using semantic similarity and ML ranking.

---

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [Backend](#backend-fastapi)
  - [Frontend](#frontend-nextjs)
  - [Docker (all services)](#docker-all-services)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Migrations](#database-migrations)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## Architecture

```
internmatch-ai/
├── frontend/        Next.js 15 + TypeScript + Tailwind CSS
├── backend/         FastAPI + SQLAlchemy 2.0 + PostgreSQL
├── ai-service/      Sentence Transformers + scikit-learn + LightGBM
├── database/        PostgreSQL init scripts + pgvector
├── datasets/        Training data and seed data
├── docs/            API specs and architecture diagrams
├── docker/          Dockerfiles for each service
└── .github/         GitHub Actions CI/CD workflows
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | ≥ 3.12 |
| Node.js | ≥ 20 |
| PostgreSQL | ≥ 16 |
| Docker & Docker Compose | Latest |

---

## Quick Start

### Backend (FastAPI)

```bash
cd backend

# 1. Create & activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy & configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL etc.

# 4. Run database migrations
alembic upgrade head

# 5. Start the development server
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000**  
Swagger UI at **http://localhost:8000/docs**

---

### Frontend (Next.js)

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Copy & configure environment
cp .env.example .env.local
# Edit .env.local with your NEXT_PUBLIC_API_URL

# 3. Start the development server
npm run dev
```

Frontend runs at **http://localhost:3000**

---

### AI Service

```bash
cd ai-service

# 1. Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy & configure environment
cp .env.example .env

# 4. Start the service
uvicorn app.main:app --reload --port 8001
```

AI Service runs at **http://localhost:8001**

---

### Docker (all services)

```bash
# 1. Copy environment files
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env.local

# 2. Start all services
docker compose up --build

# 3. Run migrations (first time)
docker compose exec backend alembic upgrade head
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL async URL | `postgresql+asyncpg://...` |
| `SECRET_KEY` | JWT signing secret | — |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL | `30` |
| `UPLOAD_DIR` | Resume upload path | `./uploads` |
| `AI_SERVICE_URL` | AI service base URL | `http://localhost:8001` |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL |

---

## API Documentation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login & get JWT token |
| `/auth/me` | GET | Get current user |
| `/resumes/upload` | POST | Upload resume (PDF/DOCX) |
| `/resumes/{id}` | GET | Get resume details |
| `/internships/` | GET | List all internships |
| `/internships/{id}` | GET | Get internship detail |
| `/recommendations/` | GET | Get personalised recommendations |
| `/applications/` | GET | List user applications |
| `/applications/` | POST | Apply to an internship |

Full interactive docs: **http://localhost:8000/docs**

---

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

---

## Project Structure

```
backend/
├── app/
│   ├── api/             Route handlers (controllers)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── resumes/
│   │   ├── internships/
│   │   ├── recommendations/
│   │   └── applications/
│   ├── models/          SQLAlchemy ORM models
│   ├── schemas/         Pydantic v2 schemas
│   ├── services/        Business logic layer
│   ├── repositories/    Data access layer (repository pattern)
│   ├── database/        DB engine & session
│   ├── config/          Settings & configuration
│   └── main.py          FastAPI application entry point
├── alembic/             Migration scripts
├── requirements.txt
└── .env.example

frontend/
├── app/                 Next.js App Router pages
├── components/          Reusable UI components
├── hooks/               Custom React hooks
├── lib/                 Utilities & API client
├── services/            API service functions
├── store/               Zustand state stores
├── types/               TypeScript interfaces
└── public/              Static assets
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT © InternMatch AI Team
