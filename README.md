# Education-math

Full‑stack learning platform combining adaptive AI math assistance, voice onboarding, performance analytics, and a gamified space theme. Backend: NestJS + TypeORM. Frontend: Next.js (App Router) + Tailwind + shadcn UI.

## Overview

Two services:

- **Frontend** (`frontend/`): Next.js UI, protected routes, AI Math game, onboarding /welcome (voice + AI extraction), profile & performance charts, system prompt management, SSE streaming consumers.
- **Backend** (`backend/`): NestJS API for auth, user profile & avatar upload, performance metrics, AI relay (ask + stream), local ASR proxy, static file serving for uploads.
  - Ollama relay (default `http://localhost:11434`) with IPv4 fallback if hostname fails.
  - ElevenLabs TTS (sync + streaming) endpoints.
  - Local speech recognition (`/ai/local`) via lightweight transformer service.
  - Chain‑of‑thought sanitizer strips `<think>` tags & fenced ```think blocks from both streamed and non‑streamed replies.

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
- AI relay utility endpoints: model listing, pull, health probe, local ASR status, TTS synth & streaming.

### Interactive AI Math Modules (New)

These hands‑on learning components were recently added / upgraded to deepen conceptual understanding:

- **Unit 2 – Linear Equation Neural Network Analogy**: 360° draggable coordinate plane with:
  - Draggable data points + dynamic best‑fit line intuition.
  - Real‑time error (residual) visualization (colored line segments) per point.
  - Full axis labels, negative ranges, quadrant shading cues.
  - Immediate visual feedback when slope/intercept adjustments change loss trend.
- **Unit 4 – Backpropagation Demo**:
  - Interactive mini network showing forward and backward passes.
  - Adjustable learning rate presets (0.01 / 0.1 / 0.5) to illustrate stability vs. divergence.
  - Reset control to restore initial weights for repeated experimentation.
  - Chain rule diagram separated for clarity (input → neuron → output) + enlarged LaTeX equation.
- **Global Math Typesetting**:
  - All Unit 4 equations rendered with **KaTeX** (fast, accessible LaTeX) for clarity.
  - Chain rule, gradient decomposition, and loss derivatives now visually consistent.

> Roadmap: Extend KaTeX coverage to earlier units; add per‑step gradient reveal & hover tooltips on diagram edges.

## Architecture Notes

Frontend owns prompt governance; backend only relays provided `system` when present. SSE frames (JSON lines prefixed with `data:`) are parsed incrementally. Voice flow: record -> send blob -> `/ai/local` -> text -> feed into `/ai/stream` with structured prompt instructions.

### Frontend Math & Visualization Stack

- **KaTeX** for deterministic LaTeX rendering (imported once in `frontend/src/app/layout.tsx`).
- Lightweight custom React components for pedagogical demos (no heavy chart libs for core math intuition pieces).
- SVG + canvas hybrid patterns kept minimal for performance under fast HMR.
- Tailwind utility tokens (now normalized in `:root`) backing color + radius design tokens.

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
- `GET /ai/models` (list local models)
- `POST /ai/pull` (trigger model pull)
- `GET /ai/health` (connectivity probe)
- `GET /ai/local-status` (ASR readiness)
- `POST /ai/tts` (ElevenLabs synth -> base64 data URL)
- `POST /ai/tts-stream` (ElevenLabs streaming audio)

Frontend Proxy:

- `POST /api/ask` (legacy non‑stream proxy; streaming uses direct backend call)

## Prompts Strategy

- All system prompts live in `frontend/src/lib/prompt.ts`.
- Backend removed default; only passes through provided `system` field.
- Gameplay instructions are internally referenced; assistant instructed not to expose unless user explicitly asks.
- Server-side sanitizer provides defense‑in‑depth removal of chain‑of‑thought artifacts no matter the prompt.

## Performance Metrics

Entity tracks per‑quiz results; service aggregates:

- `quizzesTaken`
- `correctRate` average (%)
- Streak (consecutive >=70% thresholds)

Displayed via Recharts area graph + KPIs on profile page.

### Data Model (Backend)

`User` entity highlights:

- Local auth (username/email/password) + optional Google OAuth ID.
- Email verification token & boolean flag.
- Optional structured `profile` JSON (voice onboarding extraction output).
- Avatar URL (served from `/uploads`).

`Performance` entity:

- label (quiz identifier), accuracy (0‑100 float), timestamp, relation to user (cascade on delete).

Postgres connection (dev): `synchronize: true` (disable for prod + use env vars).

## MNIST Module (Training & Frontend Inference)

The `mnist/` folder contains a self‑contained PyTorch workflow plus an export utility so the frontend can do lightweight MNIST inference (e.g. drawing digits in a learning unit) without bundling PyTorch.

Core files:

- `mnist/mnist_pytorch.py` – Train an MLP (784→256→128→10) with Adam, saving `mnist_last.pt` and best accuracy `mnist_best.pt`.
- `mnist/export_mnist_weights.py` – Extracts linear layer weights/biases + normalization stats into `frontend/public/mnist_mlp.json` for pure JS inference.
- `mnist/models/` – Checkpoints (best / last).
- `mnist/data/` – Auto‑downloaded MNIST dataset.

Quick train (PowerShell):

```powershell
cd .\mnist
python mnist_pytorch.py --epochs 5 --batch-size 64 --lr 0.001
```

Export weights for frontend (from repo root or `mnist/`):

```powershell
python mnist/export_mnist_weights.py --checkpoint mnist/models/mnist_best.pt --out frontend/public/mnist_mlp.json
```

Frontend usage:
The `/learn-ai/mnist` page (or consuming module) fetches `public/mnist_mlp.json`, normalizes a 28×28 grayscale canvas using provided mean/std, and runs manual forward passes (Linear + ReLU) client‑side.

Retraining & updating:

1. Re‑run training to improve accuracy.
2. Re‑export weights (overwrites JSON).
3. Refresh frontend – no rebuild needed unless you add new architecture fields.

Extending:

- Swap the MLP with a CNN (see example in `mnist/README.md`), then update export script accordingly (currently expects three Linear layers).
- Add confusion matrix / misclassification visualization to the learning unit.

See `mnist/README.md` for full details (architecture diagram, troubleshooting, and extension ideas).

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

If Ollama runs elsewhere, set `OLLAMA_BASE_URL` in backend environment.

If you encounter a dev hot‑reload error about `katex` CSS chunks, ensure:

1. `katex` is installed in `frontend` (`npm install katex`).
2. The global import exists at the very top of `frontend/src/app/layout.tsx`:
   ```ts
   import "katex/dist/katex.min.css";
   ```
3. Do **not** re‑`@import` KaTeX inside `globals.css` (prevents Turbopack chunk mismatch).

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
  -- `BODY_LIMIT` (default 25mb)
- `OLLAMA_BASE_URL` (override base model URL)
- `OLLAMA_MODEL` (default model, e.g. `qwen3:32b`)
- `OLLAMA_TIMEOUT_MS`, `OLLAMA_PULL_TIMEOUT_MS` (network timeouts)
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`
- `ELEVENLABS_STABILITY`, `ELEVENLABS_SIMILARITY`, `ELEVENLABS_STYLE`, `ELEVENLABS_SPEAKER_BOOST`, `ELEVENLABS_OUTPUT_FORMAT`

Frontend env:

- `NEXT_PUBLIC_BACKEND_URL` (e.g. http://localhost:3001)
- `NEXT_PUBLIC_FEATURE_FLAGS` (optional future gating)

## Streaming Consumption (Frontend)

SSE responses are parsed line‑by‑line; each `data:` JSON object may contain incremental `delta` text. Client accumulates for AI Math dialogue or onboarding extraction; final JSON parsed for structured profile fields.

### SSE Contract (simplified)

```
data: {"delta":"partial text"}
...
data: {"delta":"more"}
...
data: {"done":true}
```

Errors:

```
data: {"error":"message"}
```

## Accessibility / UX

- Keyboard focus styles on interactive elements.
- Nav hides on scroll down (more screen for content), reappears on upward scroll.
- High‑contrast gradients & subtle glow for space theme.
- Enlarged math equations (block display) in Unit 4 for readability.
- Draggable interactive learning visuals (points, network nodes) with color‑coded feedback.

## Future Ideas (Backlog)

- Server‑side guard to filter accidental gameplay instruction leakage.
- Real‑time quiz event stream updating performance live.
- Offline / PWA support for basic drills.
- Internationalization & localized prompt variants.
- Teacher / guardian dashboards.
- Expand KaTeX rendering + add inline step‑through derivations for gradient descent.
- Export interactive demo states as sharable lesson snapshots.
- Stepwise gradient descent walkthrough (press to expand each derivative link).
- Per‑edge hover tooltips in network diagrams (activation, weight, gradient).
- Educator / classroom dashboard with aggregated cohort analytics.

## Notes

- Avatar files: stored under `backend/uploads` and served at `/uploads/...`.
- Always include `credentials: 'include'` on auth‑dependent fetches.
- Keep prompts minimal & explicit; avoid leaking internal control lines.

---

Feel free to extend this README with deployment, database migration, or testing details as those parts evolve.

---

## 🐳 Docker Compose Quickstart

To run the entire stack (frontend, backend, Postgres) with a single command:

```powershell
docker compose up --build
```

This will:

- Start Postgres (with persistent volume)
- Build and run the backend (NestJS, port 3001)
- Build and run the frontend (Next.js, port 3000)

You can stop all services with:

```powershell
docker compose down
```

> For production, adjust secrets and use `npm run build`/`npm start` in the service commands.
