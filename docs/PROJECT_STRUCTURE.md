# Sequential AI — Full Project Structure & Auth Decision

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** July 2026

---

## Table of Contents

1. [Auth decision: Clerk vs. roll-your-own](#1-auth-decision-clerk-vs-roll-your-own)
2. [Monorepo layout (complete)](#2-monorepo-layout-complete)
3. [Server (`/server`)](#3-server-server)
4. [Client / Dashboard (`/client`)](#4-client--dashboard-client)
5. [SDK (`/packages/sdk`)](#5-sdk-packagessdk)
6. [Shared types (`/packages/types`)](#6-shared-types-packagestypes)
7. [Infrastructure & config files (root)](#7-infrastructure--config-files-root)
8. [Environment variables reference](#8-environment-variables-reference)
9. [Local development workflow](#9-local-development-workflow)
10. [CI/CD pipeline overview](#10-cicd-pipeline-overview)

---

## 1. Auth Decision: Clerk vs. Roll-Your-Own

This is one of the most consequential early decisions. Here is the honest trade-off breakdown for Sequential AI specifically.

---

### Option A — Clerk (recommended for v1)

**What Clerk gives you out of the box:**
- Sign-up / sign-in / magic links / OAuth (Google, GitHub)
- Session management (JWTs rotated automatically)
- React `<SignIn>` / `<UserButton>` components that take minutes to embed
- Organisation + member management (directly matches your "org-scoped API keys" model)
- Webhook on user events (`user.created`, `org.created`) — you use this to seed your Postgres `users` / `orgs` tables
- MFA, bot protection, email verification — handled
- Compliance: SOC 2 Type II, GDPR-ready

**Cost:** Free up to 10,000 monthly active users. $25/mo for 10K–50K. Above that, custom.

**What you still own in Postgres:**
```
users        (clerkUserId TEXT PK, email, createdAt)
orgs         (clerkOrgId TEXT PK, name, plan, createdAt)
org_members  (clerkOrgId, clerkUserId, role)
api_keys     (id, orgId FK, keyHash, name, scopes, createdAt, revokedAt)
```
Clerk handles the identity and session. Your DB handles everything that affects billing, usage, and API key access.

**Middleware on Express (server-side):**
```typescript
import { clerkMiddleware, requireAuth } from '@clerk/express';

app.use(clerkMiddleware());

// For dashboard routes (session-cookie auth):
app.get('/api/dashboard/*', requireAuth(), dashboardRouter);

// For API routes (API key auth — NOT Clerk):
app.use('/v1/*', apiKeyMiddleware);   // your own middleware
```

> **Important:** Clerk secures the **dashboard** (user sessions). The **Task/Monitor/Search/Extract APIs** are secured by API keys that you issue and store yourself. These are two separate auth paths.

**Verdict on Clerk for Sequential AI: strong yes for v1.** Your auth surface isn't a differentiator. What is a differentiator is the research pipeline and the SDK. Clerk lets you ship auth in a day instead of a sprint, and the org/member model maps almost perfectly to what you need.

---

### Option B — Roll Your Own

**What you'd build:**
- Password hashing (`bcrypt` / `argon2`)
- JWT signing + rotation (`jsonwebtoken`)
- Session storage (Redis or Postgres)
- Magic link / email OTP flow (integrate with Resend or SES)
- OAuth flows for Google / GitHub (Passport.js or raw PKCE)
- MFA (TOTP via `otpauth`)
- Org + member RBAC from scratch

**Realistic timeline:** 2–4 weeks for a production-quality implementation. That's 2–4 weeks not spent on the research pipeline.

**When roll-your-own makes sense:**
- You need auth to work in an air-gapped/self-hosted deployment
- You need a non-standard login flow (e.g., enterprise SSO as the *only* option)
- Clerk's pricing at scale becomes prohibitive (> 100K MAU)

**For Sequential AI v1:** none of these apply. Defer to Clerk.

---

### Auth Architecture Summary

```
Browser (Dashboard)
  │  Cookie session (Clerk-managed JWT)
  ▼
Express middleware: clerkMiddleware() → verifies session → attaches auth.userId
  │
  ▼
Dashboard API routes  (/api/dashboard/*)

─────────────────────────────────────────────────────────────

SDK / curl / Agent
  │  Authorization: Bearer sk_live_...
  ▼
Express middleware: apiKeyMiddleware() → hash key → lookup in Postgres → attach orgId
  │
  ▼
v1 API routes  (/v1/*)
```

---

## 2. Monorepo Layout (Complete)

```
sequential/                          ← repo root
│
├── packages/
│   ├── sdk/                         ← @sequential-ai/sdk  (published to npm)
│   └── types/                       ← @sequential-ai/types (shared, published to npm)
│
├── server/                          ← Express API (private)
├── client/                          ← React dashboard (private)
│
├── docs/                            ← all documentation
│   ├── PRD.md
│   ├── SDK_GUIDE.md
│   ├── PROJECT_STRUCTURE.md         ← this file
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   └── DASHBOARD.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── publish-sdk.yml
│       └── deploy-server.yml
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                     ← root package (private)
├── .env.example
└── README.md
```

---

## 3. Server (`/server`)

```
server/
├── src/
│   ├── index.ts                     ← Express app entry point
│   ├── app.ts                       ← app factory (for testing)
│   │
│   ├── config/
│   │   ├── env.ts                   ← zod-parsed env vars (fail fast on missing)
│   │   ├── db.ts                    ← Postgres pool (pg / postgres.js)
│   │   ├── redis.ts                 ← Redis client (ioredis)
│   │   └── queue.ts                 ← BullMQ queue + worker setup
│   │
│   ├── middleware/
│   │   ├── apiKey.ts                ← API key extraction + org lookup
│   │   ├── rateLimit.ts             ← per-org rate limiting (Redis-backed)
│   │   ├── usageLogger.ts           ← writes to interactions table
│   │   └── errorHandler.ts          ← maps errors to JSON envelope
│   │
│   ├── routes/
│   │   ├── v1/
│   │   │   ├── task.router.ts
│   │   │   ├── monitor.router.ts
│   │   │   ├── search.router.ts
│   │   │   ├── extract.router.ts
│   │   │   ├── memory.router.ts
│   │   │   ├── interactions.router.ts
│   │   │   └── keys.router.ts
│   │   └── dashboard/               ← Clerk-protected routes for the React dashboard
│   │       ├── tasks.router.ts
│   │       ├── usage.router.ts
│   │       └── settings.router.ts
│   │
│   ├── orchestrator/
│   │   ├── index.ts                 ← entry: takes query → decomposes → enqueues
│   │   ├── planner.ts               ← LLM call: query → sub-queries + tool assignments
│   │   ├── fanOut.ts                ← enqueues jobs onto BullMQ
│   │   └── synthesizer.ts           ← LLM call: all results → cited answer
│   │
│   ├── workers/
│   │   ├── search.worker.ts         ← BullMQ worker: calls Serper API
│   │   ├── extract.worker.ts        ← BullMQ worker: Playwright scrape
│   │   └── summary.worker.ts        ← BullMQ worker: inline result summary
│   │
│   ├── services/
│   │   ├── serper.ts                ← Serper API client wrapper
│   │   ├── playwright.ts            ← Playwright pool manager
│   │   ├── llm.ts                   ← OpenAI / Anthropic wrapper
│   │   ├── memory.ts                ← pgvector embed + query
│   │   └── trace.ts                 ← write / read trace steps from Postgres
│   │
│   ├── sse/
│   │   ├── publisher.ts             ← writes events to Redis pub/sub
│   │   └── stream.ts                ← Express SSE route handler + subscriber
│   │
│   └── db/
│       ├── schema.sql               ← canonical schema (all tables + indexes)
│       ├── migrations/              ← numbered .sql migration files
│       │   ├── 001_init.sql
│       │   ├── 002_pgvector.sql
│       │   └── 003_interactions.sql
│       └── queries/                 ← typed query functions (using postgres.js tagged SQL)
│           ├── tasks.ts
│           ├── keys.ts
│           ├── usage.ts
│           └── memory.ts
│
├── tests/
│   ├── unit/
│   │   ├── orchestrator/
│   │   ├── services/
│   │   └── middleware/
│   └── integration/
│       ├── task.test.ts
│       ├── search.test.ts
│       └── monitor.test.ts
│
├── package.json
├── tsconfig.json
└── .env                             ← not committed; see .env.example at root
```

### Key server-side design notes

**`config/env.ts` — parse env at startup, fail loudly:**
```typescript
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  SERPER_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3001),
});

export const env = schema.parse(process.env);
// If any required var is missing, this throws at startup — not mid-request.
```

**`middleware/apiKey.ts`:**
```typescript
export async function apiKeyMiddleware(req, res, next) {
  const raw = req.headers.authorization?.replace('Bearer ', '');
  if (!raw) return res.status(401).json({ error: { code: 'MISSING_KEY' } });

  const hash = await bcrypt.hash(raw, 10);  // or sha256 for speed
  const key = await db.keys.findByHash(hash);
  if (!key || key.revokedAt) return res.status(401).json({ error: { code: 'INVALID_KEY' } });

  req.orgId = key.orgId;
  next();
}
```

**SSE via Redis pub/sub (so it works across multiple server instances):**
```
Worker → Redis PUBLISH task:{taskId}:events → Express SSE subscriber → browser
```
This means any server pod can handle the SSE connection; the event doesn't have to hit the same server that started the task.

---

## 4. Client / Dashboard (`/client`)

```
client/
├── src/
│   ├── main.tsx
│   ├── App.tsx                      ← router + Clerk provider
│   │
│   ├── components/
│   │   ├── ui/                      ← design system primitives (Button, Badge, etc.)
│   │   ├── TracePanel/              ← live SSE trace tree
│   │   ├── TaskResult/              ← answer + citations renderer
│   │   ├── WorkerBar/               ← active workers progress bar
│   │   └── CodeBlock/               ← "copy as SDK call" component
│   │
│   ├── pages/
│   │   ├── playground/
│   │   │   ├── TaskPage.tsx
│   │   │   ├── MonitorPage.tsx
│   │   │   ├── MemoryPage.tsx
│   │   │   └── TracePage.tsx
│   │   ├── tools/
│   │   │   ├── SearchPage.tsx
│   │   │   └── ExtractPage.tsx
│   │   └── workspace/
│   │       ├── WorkersPage.tsx
│   │       ├── InteractionsPage.tsx
│   │       └── ConfigurePage.tsx
│   │
│   ├── hooks/
│   │   ├── useTaskStream.ts         ← wraps SSE connection to /v1/monitor/:id
│   │   ├── useApiKeys.ts
│   │   └── useUsage.ts
│   │
│   ├── lib/
│   │   ├── api.ts                   ← typed fetch wrapper (uses Clerk session token)
│   │   └── utils.ts
│   │
│   └── styles/
│       └── globals.css
│
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. SDK (`/packages/sdk`)

> See [SDK_GUIDE.md](./SDK_GUIDE.md) for the full SDK implementation guide.

```
packages/sdk/
├── src/
│   ├── index.ts                     ← public exports
│   ├── client.ts                    ← Sequential class
│   ├── config.ts
│   ├── http.ts                      ← fetch wrapper + retries
│   ├── errors.ts
│   ├── modules/
│   │   ├── task.ts
│   │   ├── monitor.ts
│   │   ├── search.ts
│   │   ├── extract.ts
│   │   └── memory.ts
│   ├── streaming/
│   │   ├── sse.ts
│   │   └── types.ts
│   └── types/
│       ├── task.ts
│       ├── search.ts
│       ├── extract.ts
│       ├── memory.ts
│       └── common.ts
├── tests/
│   ├── unit/
│   └── integration/
├── examples/
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

## 6. Shared Types (`/packages/types`)

A thin package with zero dependencies — just TypeScript interfaces shared between the server and SDK.

```
packages/types/
├── src/
│   ├── index.ts
│   ├── task.ts
│   ├── monitor.ts
│   ├── search.ts
│   ├── extract.ts
│   ├── memory.ts
│   └── errors.ts
├── package.json
└── tsconfig.json
```

`package.json`:
```json
{
  "name": "@sequential-ai/types",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "private": false
}
```

> This package is published to npm so that third-party integrators can import just the types without pulling in the full SDK.

---

## 7. Infrastructure & Config Files (Root)

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'server'
  - 'client'
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {}
  }
}
```

### Root `package.json`

```json
{
  "name": "sequential-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### `.env.example` (committed to repo)

```bash
# ── Database ──────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/sequential

# ── Redis ─────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Clerk (auth for dashboard) ────────────────────────────
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# ── External services ─────────────────────────────────────
SERPER_API_KEY=...
OPENAI_API_KEY=sk-...

# ── Server ────────────────────────────────────────────────
PORT=3001
NODE_ENV=development

# ── Client ────────────────────────────────────────────────
VITE_API_URL=http://localhost:3001
```

---

## 8. Environment Variables Reference

| Variable | Used by | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | server | ✅ | Postgres connection string |
| `REDIS_URL` | server | ✅ | Redis connection string |
| `CLERK_SECRET_KEY` | server | ✅ | Clerk server-side secret |
| `VITE_CLERK_PUBLISHABLE_KEY` | client | ✅ | Clerk publishable key for React |
| `SERPER_API_KEY` | server | ✅ | Serper.dev API key |
| `OPENAI_API_KEY` | server | ✅ | LLM provider (planner + synthesis) |
| `PORT` | server | ❌ | Default: 3001 |
| `VITE_API_URL` | client | ❌ | Points client at server. Default: `http://localhost:3001` |
| `NODE_ENV` | server | ❌ | `development` / `production` |

---

## 9. Local Development Workflow

### Prerequisites

```bash
node >= 18
pnpm >= 9
docker (for local Postgres + Redis)
```

### First-time setup

```bash
# 1. Clone and install
git clone https://github.com/sequential-ai/sequential
cd sequential
pnpm install

# 2. Start Postgres + Redis via Docker
docker compose up -d

# 3. Copy env and fill in your keys
cp .env.example server/.env
cp .env.example client/.env

# 4. Run database migrations
pnpm --filter server db:migrate

# 5. Start everything in dev mode
pnpm dev
```

`pnpm dev` runs via Turborepo in parallel:
- `server`: `ts-node-dev src/index.ts` on port 3001
- `client`: `vite` on port 5173
- `packages/sdk`: `tsup --watch` (so dashboard can import from source)

### `docker-compose.yml` (development only)

```yaml
version: '3.9'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: sequential
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes

volumes:
  pg_data:
```

---

## 10. CI/CD Pipeline Overview

### GitHub Actions — `ci.yml` (runs on every PR)

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_DB: sequential_test
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
        env:
          DATABASE_URL: postgresql://user:password@localhost:5432/sequential_test
          REDIS_URL: redis://localhost:6379

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

### Deployment targets

| Package | How deployed |
|---|---|
| `server` | Docker container → Railway / Render / EC2. BullMQ workers run as separate processes (same image, different start command: `node dist/workers/index.js`) |
| `client` | Static build → Vercel / Netlify (GitHub integration, auto-deploy on merge to `main`) |
| `packages/sdk` | npm publish (triggered by `sdk/v*` git tag via `publish-sdk.yml`) |
| Postgres | Neon (serverless Postgres with pgvector) or Railway Postgres |
| Redis | Upstash (serverless Redis) or Railway Redis |

---

## Decision Log

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo vs. multi-repo | Monorepo (pnpm workspaces) | Type sharing between server/SDK without publishing; one CI pipeline |
| SDK vs. server in same package | Separate packages | SDK must be publishable independently; server deps must never land in SDK bundle |
| Auth: Clerk vs. custom | **Clerk** for v1 | Dashboard auth in a day; org model maps to Sequential's needs; not a differentiator |
| API key auth | Custom (Postgres-backed) | API keys are Sequential's own product; Clerk does not manage them |
| Build tool for SDK | tsup | Fastest TS bundler; dual CJS/ESM output; zero config for d.ts |
| Monorepo build orchestration | Turborepo | Cached builds; parallel task execution across packages |
| Database | Postgres + pgvector | One DB for relational + vector; avoids separate Pinecone/Weaviate |
| Queue | Redis + BullMQ | Native fan-out; horizontal scaling; job visibility + retry built in |
