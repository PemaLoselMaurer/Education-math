# Education-math

Full‑stack learning platform combining adaptive AI math assistance, voice onboarding, performance analytics, and a gamified space theme. Backend: NestJS + TypeORM. Frontend: Next.js (App Router) + Tailwind + shadcn UI.

## Overview

Two services:

- **Frontend** (`frontend/`): Next.js UI, protected routes, AI Math game, onboarding /welcome (voice + AI extraction), profile & performance charts, system prompt management, SSE streaming consumers.
- **Backend** (`backend/`): NestJS API for auth, user profile & avatar upload, performance metrics, AI relay (ask + stream), local ASR proxy, static file serving for uploads.

## Current Feature Set

- Cookie‑based JWT auth (register, login, logout) with session check `GET /user/me`.
- Onboarding **Welcome Page**: voice capture -> local ASR (`/ai/local`) -> AI JSON extraction (streamed) -> profile update.
- AI Math streaming chat/game: SSE live responses with client‑side system prompt injection.
- Split system prompts: `AI_MATH_SYSTEM_PROMPT` & `WELCOME_SYSTEM_PROMPT` managed purely in frontend (backend no default prompt).
- Hidden internal gameplay context (model knows controls; only reveals on user request).
- Performance analytics entity (quizzes taken, correct rate avg, streak logic) surfaced on profile with Recharts graph.
- Avatar upload via Data URL to `POST /user/avatar`; served from `/uploads`.
- Secure fetches with `credentials: 'include'` + CORS allowlist.
- Voice & audio utilities (MediaRecorder -> WAV encoding) for ASR.
- Streaming standardization: both AI Math and Welcome use `/ai/stream` SSE.
- Responsive multi‑section homepage (hero, features, CTA) with transparent hide‑on‑scroll nav and animated SVG logo.

## Architecture Notes

Frontend owns prompt governance; backend only relays provided `system` when present. SSE frames (JSON lines prefixed with `data:`) are parsed incrementally. Voice flow: record -> send blob -> `/ai/local` -> text -> feed into `/ai/stream` with structured prompt instructions.

## Data / Flow Summary

| Flow        | Steps                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Auth        | form -> `/user/login` -> httpOnly cookie -> gated pages check `/user/me`                                             |
| Onboarding  | mic capture -> `/ai/local` (ASR) -> partial transcript -> `/ai/stream` (extraction) -> parsed JSON -> profile update |
| AI Math     | user question / voice -> `/ai/stream` (SSE) -> incremental UI update                                                 |
| Avatar      | client Data URL -> `POST /user/avatar` -> file saved -> URL stored & rendered                                        |
| Performance | quiz/game events persisted -> aggregated endpoint -> chart                                                           |

## Folder Structure (simplified)

```
backend/  # NestJS source (auth, user, ai, performance, uploads)
frontend/ # Next.js app (app router pages, components, lib prompts)
```

## Key Endpoints (Backend)

Auth:

- `POST /user/register`
- `POST /user/login`
- `POST /user/logout`
- `GET /user/me`

Profile / User:

- `GET /user/profile`
- `POST /user/avatar` (body: `{ imageData: string }` Data URL)
- `GET /user/performance` (aggregated metrics)

AI & Voice:

- `POST /ai/ask` (non‑stream reply)
- `POST /ai/stream` (Server‑Sent Events streaming JSON chunks)
- `POST /ai/local` (local / lightweight ASR)

Frontend Proxy:

- `POST /api/ask` (legacy non‑stream proxy; streaming uses direct backend call)

## Prompts Strategy

- All system prompts live in `frontend/src/lib/prompt.ts`.
- Backend removed default; only passes through provided `system` field.
- Gameplay instructions are internally referenced; assistant instructed not to expose unless user explicitly asks.

## Performance Metrics

Entity tracks per‑quiz results; service aggregates:

- `quizzesTaken`
- `correctRate` average (%)
- Streak (consecutive >=70% thresholds)

Displayed via Recharts area graph + KPIs on profile page.

## Running Locally (Dev)

Open two terminals.

Backend (NestJS):

```powershell
cd .\backend
npm install
npm run start:dev
```

Frontend (Next.js):

```powershell
cd .\frontend
npm install
npm run dev
```

Defaults:

- Backend: http://localhost:3001
- Frontend: http://localhost:3000 (Next may pick 3001+/3002 if occupied)

Production build:

```powershell
# Backend
cd .\backend; npm run build; npm run start:prod

# Frontend
cd .\frontend; npm run build; npm start
```

## Configuration

Backend env (optional):

- `PORT` (default 3001)
- `FRONTEND_ORIGIN` (CORS allow origin)
- `COOKIE_SECRET` (signing secret)
- `BODY_LIMIT` (default 25mb)

Frontend env:

- `NEXT_PUBLIC_BACKEND_URL` (e.g. http://localhost:3001)

## Streaming Consumption (Frontend)

SSE responses are parsed line‑by‑line; each `data:` JSON object may contain incremental `delta` text. Client accumulates for AI Math dialogue or onboarding extraction; final JSON parsed for structured profile fields.

## Accessibility / UX

- Keyboard focus styles on interactive elements.
- Nav hides on scroll down (more screen for content), reappears on upward scroll.
- High‑contrast gradients & subtle glow for space theme.

## Future Ideas (Backlog)

- Server‑side guard to filter accidental gameplay instruction leakage.
- Real‑time quiz event stream updating performance live.
- Offline / PWA support for basic drills.
- Internationalization & localized prompt variants.
- Teacher / guardian dashboards.

## Notes

- Avatar files: stored under `backend/uploads` and served at `/uploads/...`.
- Always include `credentials: 'include'` on auth‑dependent fetches.
- Keep prompts minimal & explicit; avoid leaking internal control lines.

---

Feel free to extend this README with deployment, database migration, or testing details as those parts evolve.
