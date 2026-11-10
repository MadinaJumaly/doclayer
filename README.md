# DocLayer

A collaborative document editor with real-time co-editing and a built-in AI writing assistant.

- **Real-time collaboration** — multiple users edit the same document at once, with live cursors (Tiptap + Yjs over Hocuspocus).
- **Rich text** — headings, lists, task lists, tables, images, links.
- **Accounts** — email/password signup and Google sign-in, JWT-based auth.
- **DocLayer AI** — an assistant that answers questions about the open document using retrieval (RAG) and tool calling.

## Architecture

```
┌──────────────┐   HTTP (/api/*)   ┌──────────────────┐
│  frontend    │ ────────────────▶ │  backend         │ ──▶ PostgreSQL
│  Next.js 15  │                   │  Django + Ninja  │ ──▶ OpenAI (AI assistant)
└──────┬───────┘                   └────────▲─────────┘
       │ WebSocket (Yjs)                    │ load / save document HTML
       ▼                                    │
┌──────────────────┐                        │
│  collab-server   │ ───────────────────────┘
│  Hocuspocus      │
└──────────────────┘
```

| Directory        | What it is |
|------------------|------------|
| `backend/`       | Django 5 + Django Ninja REST API (`backend/src`). Apps: `accounts`, `documents`, `ai`, `googler` (Google OAuth), `profiles`. |
| `frontend/`      | Next.js 15 (App Router), React 19, Tailwind, shadcn/ui. Proxies API calls to Django through `src/app/api/`. |
| `collab-server/` | Hocuspocus WebSocket server. Verifies the user's Django JWT, loads the document from the API, and saves it back as HTML (debounced). |
| `shared/`        | Tiptap schema shared by the frontend and collab server so both convert documents the same way. |
| `compose.yaml`   | Local PostgreSQL (port `5440`) and the collab server. |

## Prerequisites

- Python 3.12+
- Node.js 22+
- Docker (for PostgreSQL), or your own PostgreSQL instance

## Local setup

### 1. Database

```bash
docker compose up -d postgres
```

This starts PostgreSQL on `localhost:5440` (user/password/db: `postgres`).

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements.dev.txt

cp .env.sample .env
```

Edit `backend/.env`:

- Add `DATABASE_URL=postgresql://postgres:postgres@localhost:5440/postgres` (required — only PostgreSQL is supported).
- Set `DJANGO_SECRET_KEY` (generate one with `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`).
- Set `OPENAI_API_KEY` to enable the AI assistant. `AI_CHAT_MODEL` and `AI_EMBED_MODEL` are optional.
- Set `GOOGLE_CLIENT_ID` / `GOOGLE_SECRET_KEY` to enable Google sign-in.

Then:

```bash
cd src
python manage.py migrate
python manage.py runserver      # http://localhost:8000
```

### 3. Collab server

```bash
cd collab-server
npm install
cp .env.sample .env
npm run dev                     # ws://localhost:1234
```

`DJANGO_SECRET_KEY` in `collab-server/.env` must **exactly** match the backend's — it's used to verify access tokens. Quote it if it contains `#` or `$`.

Alternatively, run it in Docker with `DJANGO_SECRET_KEY=... docker compose up collab` (it reaches the backend at `host.docker.internal:8000`).

### 4. Frontend

```bash
cd frontend
npm install
cp .env.sample .env.local
npm run dev                     # http://localhost:3000
```

| Variable                    | Default                       |
|-----------------------------|-------------------------------|
| `DJANGO_API_URL`            | `http://localhost:8000/api/`  |
| `NEXT_PUBLIC_COLLAB_WS_URL` | `ws://localhost:1234`         |

## API overview

All routes are under `/api/`. Interactive docs are at `http://localhost:8000/api/docs` when the backend is running.

| Method | Path                           | Description |
|--------|--------------------------------|-------------|
| POST   | `/api/signup/`                 | Create an account, returns JWT pair |
| POST   | `/api/login/`                  | Email/password login, returns JWT pair |
| POST   | `/api/token/refresh/`          | Refresh access token |
| GET    | `/api/google/login/`           | Get Google OAuth redirect URL |
| POST   | `/api/google/callback/`        | Complete Google sign-in |
| GET/POST | `/api/documents/`            | List / create documents |
| GET/PUT/DELETE | `/api/documents/{id}/` | Read / update / delete a document |
| POST   | `/api/ai/`                     | Ask the AI assistant about a document |
| GET    | `/api/healthz/`                | Health check |

## Tests

```bash
# Backend (pytest)
cd backend/src
pytest

# Frontend (Jest)
cd frontend
npm test
```

## Deployment

Each service has its own `Dockerfile` and `railway.json` and is deployed to [Railway](https://railway.app) as a separate service from this monorepo:

- **backend** — runs `collectstatic`, `migrate`, then Gunicorn. Health check: `/api/healthz/`. Set `DATABASE_URL`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `FRONTEND_URL`, and `DJANGO_DEBUG=False`.
- **frontend** — Next.js build. Health check: `/healthz`.
- **collab-server** — Node server; needs `DJANGO_API_URL` and the same `DJANGO_SECRET_KEY` as the backend.

The frontend and collab-server Docker builds use the repo root as context so they can include `shared/`.
