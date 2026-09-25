# CareerScope AI

**Agentic live job-market intelligence & career planning.**

Upload your resume, choose a target role and location, and let a team of AI agents scan the *live* job market (via SerpApi's Google Jobs engine), analyze demand, compare it with your actual skills, surface gaps, and produce a personalized 30-day career roadmap — every number grounded in retrieved evidence.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  React + TypeScript frontend (Vite · Tailwind · Recharts)   :5173      │
│  /api proxy → backend                                                 │
└──────────────┬─────────────────────────────────────────────────────────┘
               │ HTTP + JSON · HttpOnly JWT cookie + CSRF double-submit
┌──────────────▼─────────────────────────────────────────────────────────┐
│  FastAPI backend (Python) · uvicorn                    :8000           │
│  ├── /api/auth       JWT sessions, verification, password reset         │
│  ├── /api/analyses   create → run pipeline → poll live status          │
│  ├── /api/dashboard  aggregated stats / charts for home                │
│  ├── /api/market · /api/skills · /api/roadmaps  per-analysis views     │
│  ├── /api/resumes · /api/jobs (save) · /api/profile · /api/settings    │
│  ├── SecurityMiddleware  origin + CSRF + rate-limit                    │
│  └── LangGraph pipeline (asyncio executor)                             │
│        Manager → Resume Analyzer → Job Market → Skill Intelligence     │
│        → Skill Gap → Career Planner → Insight → Persist                │
│        TIER 1 (deterministic): SerpApi fetch + Python statistics       │
│        TIER 2 (LLM via Groq): interpretation, gaps, roadmap, report    │
└───────┬──────────────────────────────────────────────┬─────────────────┘
        │ SQLAlchemy 2.0                                │ external APIs
┌───────▼──────────┐                          ┌─────────▼─────────┐
│ PostgreSQL 16    │                          │ SerpApi (live     │
│ (or SQLite dev)  │                          │ Google Jobs)      │
└──────────────────┘                          │ Groq (LLM)        │
                                              └───────────────────┘
```

**Why a graph?** Eight single-purpose agents each own one job. Rule-based numbers are computed in pure Python (skill frequency, work-mode, experience buckets, salary mentions, top companies). The LLM only *interprets* those numbers — it cannot invent statistics. Extracted resume skills must literally appear in the resume text.

---

## Repo layout

```
backend/
  app/
    main.py               FastAPI app, middleware, startup table creation
    core/                 config, security (JWT/bcrypt), deps, logging
    db/                   SQLAlchemy session
    models/               13 tables: users, profiles, resumes, analyses,
                          jobs, skills, analysis_skills, roadmaps,
                          roadmap_items, saved_jobs, searches,
                          activity_logs, token_blacklist
    schemas/              Pydantic request/response models
    integrations/         serpapi.py, groq_client.py
    services/             extractor, market_stats, resume_parser,
                          resume_upload, analysis_service, prompts, email
    agents/               state, nodes, graph (LangGraph StateGraph)
    api/                  routers (auth, dashboard, resumes, analyses,
                          market, skills, roadmaps, jobs, profile, settings)
  migrations/             Alembic (0001_initial)
  Dockerfile
  requirements.txt
frontend/
  src/
    api/                  axios client (CSRF, errors), TypeScript types
    context/              AuthContext
    components/           UI kit, charts, cards, layouts, ProgressSteps
    pages/                Landing, Dashboard, Analyze, AnalysisDetail,
                          Market, Skills, Roadmap, History, SavedJobs,
                          Profile, Settings, auth pages
docker-compose.yml        PostgreSQL + backend
start.ps1 / start.sh      local dev launcher (backend + frontend)
```

---

## Quick start (local development)

Requirements: **Python 3.10+**, **Node 18+**, **PostgreSQL** (optional — SQLite works for dev).

### 1. Environment

```bash
cp .env.example .env
# then fill in:
#   SECRET_KEY, JWT_SECRET_KEY   (python -c "import secrets; print(secrets.token_urlsafe(48))")
#   GROQ_API_KEY                 https://console.groq.com
#   SERPAPI_API_KEY              https://serpapi.com
```

Two database options:

- **PostgreSQL** (recommended): set `DATABASE_URL=postgresql+psycopg2://careerscope:careerscope@localhost:5432/careerscope`, keep `USE_SQLITE=false`.
- **SQLite quick start**: set `USE_SQLITE=true`. The backend auto-creates `careerscope.db` and all tables.

> If you prefer docker, `docker-compose up --build` brings up PostgreSQL + the backend; run the frontend locally with `npm run dev`.

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # PowerShell
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on startup (`AUTO_CREATE_TABLES=true`). For Alembic instead:

```bash
alembic upgrade head
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — sign up, then **Analyze My Career** with a resume (PDF/DOCX/TXT) and a target role.

> No SMTP configured? In development mode, email verification is skipped and password-reset links are returned by the API (dev mode) / logged on the server. Configure SMTP_HOST/SMTP_USER/SMTP_PASSWORD/SMTP_FROM to enable real emails.

---

## What the pipeline does per analysis

1. **Resume Analyzer** — extracts skills, tools, education, projects, certifications, roles and a summary from the uploaded resume (PDF/DOCX/TXT). Every extracted string is validated against the raw text (no hallucinated skills).
2. **Job Market** — pulls live job postings from SerpApi's Google Jobs engine for role + location (+ filters).
3. **Skill Intelligence** — computes objective demand: % of postings mentioning each skill, work-mode availability, experience buckets, salary mentions, top companies/industries, all stored as evidence.
4. **Skill Gap** — classifies every demanded skill as *strong / partial / missing* with a priority and a human-readable reason; computes the overall alignment score (weighted demand coverage — not an employability score).
5. **Career Planner** — a 30-day roadmap grouped by week targeting high-priority gaps, with learning objectives, practice, a project task and interview prep, plus linked resources.
6. **Insight** — writes the executive summary, strengths, critical gaps, opportunities and next steps, grounded in the deterministic numbers.
7. **Persist** — saves everything so history, roadmap check-offs and saved jobs survive.

### Scoring

`alignment = Σ(wᵢ · coveredᵢ) / Σ(wᵢ)`, where `wᵢ` is how often skill *i* appears in live postings and `coveredᵢ` = 100% (strong), 50% (partial), 0% (missing). A **perfect-score resume in a weak-signal market is still possible**, and the UI says so.

---

## Environment variables

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy PostgreSQL URL | yes (unless USE_SQLITE) |
| `USE_SQLITE` | `true` → dev SQLite fallback | no |
| `SECRET_KEY` / `JWT_SECRET_KEY` | signing secrets | yes |
| `GROQ_API_KEY` | LLM interpretation agent | yes |
| `GROQ_MODEL` | model id (default `llama-3.3-70b-versatile`) | no |
| `SERPAPI_API_KEY` | live Google Jobs retrieval | yes |
| `FRONTEND_URL` / `BACKEND_URL` | CORS + email links | no |
| `SMTP_*` | verification / reset emails | optional |
| `ENV=`production` | forces Secure cookies | yes for production |
| `AUTO_CREATE_TABLES` | create tables on startup | no |
| `MAX_UPLOAD_SIZE_MB` | resume limit (default 10) | no |

---

## Security model

- Passwords hashed with **bcrypt**; sessions are **JWT** tokens in an **HttpOnly** cookie (`SameSite=Lax`) — not localStorage.
- **CSRF double-submit**: a readable `careerscope_csrf` cookie must match the `X-CSRF-Token` header on every unsafe request (login/signup/reset excluded).
- Origin allow-list check on unsafe methods.
- Ownership enforced on **every** user-data query; jobs can only be saved if they come from your own analyses.
- In-memory per-IP auth rate limiting, optional via `RATE_LIMIT_ENABLED` (see `config.py`).

## Getting API keys

- **SerpApi**: https://serpapi.com — Google Jobs is available on the starter plan.
- **Groq**: https://console.groq.com — free tier is generous; `llama-3.3-70b-versatile` works well and is fast.

## Troubleshooting

- **Backend can't reach DB**: with docker, `docker-compose up --build` then use the compose`DATABASE_URL`; without docker, make sure local Postgres is running on 5432 or switch to `USE_SQLITE=true`.
- **401 on save/rename after sign-in**: refresh the page once — the CSRF cookie is rotated at sign-in on the first request by design.
- **Analysis fails with a SerpApi error**: the failure message is surfaced on the analysis page; check your key/plan, then hit **Re-run**.
- **No jobs found**: try a broader role or a major location; Google Jobs returns fewer results for niche roles.
- **`Scripts\Activate.ps1` blocked**: run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first, or use `start.ps1` which handles it.