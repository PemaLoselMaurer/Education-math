# Education-math

A full‑stack learning app with a NestJS backend and a Next.js frontend focused on math practice, AI assistance, and a gamified UI.

## Overview

Education‑math is a two‑service app:

- Frontend: Next.js (App Router) UI with protected routes, math gameplay, profile, and an API route that proxies AI requests to the backend.
- Backend: NestJS API providing authentication, user profile and avatar handling, math/AI endpoints, and static file serving for uploads.

Key features

- Cookie‑based JWT auth (login/register/logout) with `GET /user/me` for session checks.
- Profile and avatar: fetch profile, upload avatar via Data URL, files served under `/uploads`.
- AI ask: frontend forwards requests to backend AI endpoint via `/api/ask` proxy.
- CORS with credentials between localhost ports; frontend fetches include cookies.

Data flow (high level)

- Auth: Frontend submits credentials to backend; backend sets httpOnly cookie; frontend checks `/user/me` for gated pages.
- Profile: Frontend loads `/user/profile`; avatar uploads via `POST /user/avatar` (Data URL) → backend saves to `uploads/` and returns `avatarUrl` → frontend renders via full URL.
- AI: Frontend calls `/api/ask` → proxy relays to backend `/ai/ask` → response streamed back to UI.

Folders

- `backend/` NestJS app and API endpoints (serves `/uploads`).
- `frontend/` Next.js app (UI, API route proxy, pages/components).

## Project status (progress)

- Backend (NestJS)

  - Auth: Cookie‑based JWT login/register/logout, protected routes, `/user/me` working.
  - Profile: `GET /user/profile`, `POST /user/avatar` (Data URL upload), static `/uploads` serving. Avatar URL persisted on user.
  - AI: `POST /ai/ask` wired; proxied by frontend API.
  - CORS: Enabled with credentials for localhost ports and optional `FRONTEND_ORIGIN`.
  - Build: `npm run build` OK; dev server runs on port 3001 by default.

- Frontend (Next.js App Router)
  - Auth pages: Login/Register; redirects to `next` param or home on success.
  - Home, Math game, AI page, Learning Path pages present.
  - Profile page: Read‑only details fetched from backend, avatar upload, recent activity, and a performance section with a compact SVG graph.
  - Middleware gating (auth) and credentialed fetches to backend.
  - Build: `npm run build` OK; dev server on 3000 (falls back if busy).

## How to run (dev)

Open two terminals and run backend and frontend separately.

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

- Backend URL: http://localhost:3001
- Frontend URL: http://localhost:3000 (may switch to 3002 if 3000 is used)

For production builds:

```powershell
# Backend
cd .\backend; npm run build; npm run start:prod

# Frontend
cd .\frontend; npm run build; npm start
```

## Configuration

Environment variables (optional):

- Backend
  - `PORT` (default 3001)
  - `FRONTEND_ORIGIN` (adds to CORS allowlist)
  - `COOKIE_SECRET` (cookies signing secret)
  - `BODY_LIMIT` (payload size, default 25mb)
- Frontend
  - `NEXT_PUBLIC_BACKEND_URL` (e.g., http://localhost:3001)

## Key endpoints

- Auth
  - `POST /user/register`
  - `POST /user/login`
  - `POST /user/logout`
  - `GET /user/me`
- Profile
  - `GET /user/profile`
  - `POST /user/avatar` (body: `{ imageData: string }` Data URL)
- AI
  - Backend: `POST /ai/ask`
  - Frontend proxy: `POST /api/ask`

## Notes

- Avatar files are saved under `backend/uploads` and served at `/uploads/...`.
- Frontend requests include credentials; ensure CORS and cookie settings are aligned in development.
