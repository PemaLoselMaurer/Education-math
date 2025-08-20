# Education-math

A full‑stack learning app with a NestJS backend and a Next.js frontend focused on math practice, AI assistance, and a gamified UI.

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
