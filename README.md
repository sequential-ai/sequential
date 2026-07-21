# Sequential AI

> **Parallel web-research API platform built for AI agents.**
> Fan a single research query out across a pool of parallel workers — each independently searching and extracting content — then synthesize everything into a single cited answer.

---

## Table of Contents

1. [What is Sequential AI?](#1-what-is-sequential-ai)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Folder Structure](#4-folder-structure)
5. [Environment Variables](#5-environment-variables)
6. [Setup Guide](#6-setup-guide)
7. [Available Commands](#7-available-commands)
8. [API Overview](#8-api-overview)
9. [Auth Architecture](#9-auth-architecture)
10. [Documentation](#10-documentation)
11. [Deployment](#11-deployment)

---

## 1. What is Sequential AI?

Sequential AI solves the **sequential bottleneck** — today's AI agents research the web one URL at a time:

| Problem | Impact |
|---|---|
| **Latency** | A 10-source job at 3 s/source = 30 s minimum |
| **Coverage gaps** | Plain `fetch` fails on JS-rendered SPAs and paywalled pages |
| **Opacity** | No standard way to observe what a research job actually did |

### Two Core Products

| Product | What it does |
|---|---|
| **Task API** | Accepts a query, fans it out across parallel Search + Extract workers, synthesizes a cited answer |
| **Monitor API** | Streams a real-time trace of every step inside a running (or completed) task over SSE |

---

## 2. Tech Stack

### Server
| Layer | Technology |
|---|---|
| Runtime | Node.js >= 18 |
| Framework | Express 5 |
| Language | JavaScript (CommonJS) / TypeScript (planned) |
| Queue | BullMQ + Redis |
| Database | PostgreSQL + pgvector |
| Auth (Dashboard) | Clerk |
| Auth (API) | Custom API key middleware |
| Web scraping | Playwright |
| Search | Serper API |
| LLM | OpenAI / Anthropic |
| Real-time | Server-Sent Events (SSE) over Redis pub/sub |

### Client
| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Auth | Clerk React |

### Monorepo
| Tool | Purpose |
|---|---|
| pnpm workspaces | Package management |
| Turborepo | Parallel builds + caching |

---

## 3. Prerequisites

```bash
node >= 18
pnpm >= 9
docker          # for local Postgres + Redis
```

Install `pnpm` if you do not have it:

```bash
npm install -g pnpm
```

---

## 4. Folder Structure

```
sequential/                          <- repo root
|
+-- packages/
|   +-- sdk/                         <- @sequential-ai/sdk  (published to npm)
|   |   +-- src/
|   |   |   +-- index.ts             <- public exports
|   |   |   +-- client.ts            <- Sequential class
|   |   |   +-- http.ts              <- fetch wrapper + retries
|   |   |   +-- errors.ts
|   |   |   +-- modules/
|   |   |   |   +-- task.ts
|   |   |   |   +-- monitor.ts
|   |   |   |   +-- search.ts
|   |   |   |   +-- extract.ts
|   |   |   |   +-- memory.ts
|   |   |   +-- streaming/
|   |   |       +-- sse.ts
|   |   |       +-- types.ts
|   |   +-- examples/
|   |   +-- tests/
|   |   +-- package.json
|   |
|   +-- types/                       <- @sequential-ai/types (shared, published to npm)
|       +-- src/
|       |   +-- index.ts
|       |   +-- task.ts
|       |   +-- monitor.ts
|       |   +-- search.ts
|       |   +-- extract.ts
|       |   +-- memory.ts
|       |   +-- errors.ts
|       +-- package.json
|
+-- server/                          <- Express API (private)
|   +-- app.js                       <- Express app entry point
|   +-- src/
|   |   +-- config/
|   |   |   +-- env.ts               <- zod-parsed env vars (fail fast)
|   |   |   +-- db.ts                <- Postgres pool
|   |   |   +-- redis.ts             <- Redis client (ioredis)
|   |   |   +-- queue.ts             <- BullMQ queue + worker setup
|   |   |
|   |   +-- middleware/
|   |   |   +-- apiKey.ts            <- API key extraction + org lookup
|   |   |   +-- rateLimit.ts         <- per-org rate limiting (Redis-backed)
|   |   |   +-- usageLogger.ts       <- writes to interactions table
|   |   |   +-- errorHandler.ts      <- maps errors to JSON envelope
|   |   |
|   |   +-- routes/
|   |   |   +-- v1/                  <- API key protected routes
|   |   |   |   +-- task.router.ts
|   |   |   |   +-- monitor.router.ts
|   |   |   |   +-- search.router.ts
|   |   |   |   +-- extract.router.ts
|   |   |   |   +-- memory.router.ts
|   |   |   |   +-- interactions.router.ts
|   |   |   |   +-- keys.router.ts
|   |   |   +-- dashboard/           <- Clerk-protected routes for React dashboard
|   |   |       +-- tasks.router.ts
|   |   |       +-- usage.router.ts
|   |   |       +-- settings.router.ts
|   |   |
|   |   +-- orchestrator/
|   |   |   +-- index.ts             <- entry: query -> decompose -> enqueue
|   |   |   +-- planner.ts           <- LLM: query -> sub-queries + tool assignments
|   |   |   +-- fanOut.ts            <- enqueues jobs onto BullMQ
|   |   |   +-- synthesizer.ts       <- LLM: all results -> cited answer
|   |   |
|   |   +-- workers/
|   |   |   +-- search.worker.ts     <- BullMQ worker: calls Serper API
|   |   |   +-- extract.worker.ts    <- BullMQ worker: Playwright scrape
|   |   |   +-- summary.worker.ts    <- BullMQ worker: inline result summary
|   |   |
|   |   +-- services/
|   |   |   +-- serper.ts            <- Serper API client wrapper
|   |   |   +-- playwright.ts        <- Playwright pool manager
|   |   |   +-- llm.ts               <- OpenAI / Anthropic wrapper
|   |   |   +-- memory.ts            <- pgvector embed + query
|   |   |   +-- trace.ts             <- write / read trace steps from Postgres
|   |   |
|   |   +-- sse/
|   |   |   +-- publisher.ts         <- writes events to Redis pub/sub
|   |   |   +-- stream.ts            <- Express SSE route handler + subscriber
|   |   |
|   |   +-- db/
|   |       +-- schema.sql           <- canonical schema (all tables + indexes)
|   |       +-- migrations/          <- numbered .sql migration files
|   |       |   +-- 001_init.sql
|   |       |   +-- 002_pgvector.sql
|   |       |   +-- 003_interactions.sql
|   |       +-- queries/             <- typed query functions
|   |           +-- tasks.ts
|   |           +-- keys.ts
|   |           +-- usage.ts
|   |           +-- memory.ts
|   |
|   +-- .env                         <- NOT committed; copy from .env.example
|   +-- .env.example
|   +-- package.json
|
+-- client/                          <- React Dashboard (private)
|   +-- src/
|   |   +-- main.jsx                 <- React entry point
|   |   +-- App.jsx                  <- Router + Clerk provider
|   |   +-- components/
|   |   |   +-- ui/                  <- design system primitives
|   |   |   +-- TracePanel/          <- live SSE trace tree
|   |   |   +-- TaskResult/          <- answer + citations renderer
|   |   |   +-- WorkerBar/           <- active workers progress bar
|   |   |   +-- CodeBlock/           <- "copy as SDK call" component
|   |   +-- pages/
|   |   |   +-- playground/
|   |   |   |   +-- TaskPage.tsx
|   |   |   |   +-- MonitorPage.tsx
|   |   |   |   +-- MemoryPage.tsx
|   |   |   |   +-- TracePage.tsx
|   |   |   +-- tools/
|   |   |   |   +-- SearchPage.tsx
|   |   |   |   +-- ExtractPage.tsx
|   |   |   +-- workspace/
|   |   |       +-- WorkersPage.tsx
|   |   |       +-- InteractionsPage.tsx
|   |   |       +-- ConfigurePage.tsx
|   |   +-- hooks/
|   |   |   +-- useTaskStream.ts     <- wraps SSE connection
|   |   |   +-- useApiKeys.ts
|   |   |   +-- useUsage.ts
|   |   +-- lib/
|   |       +-- api.ts               <- typed fetch wrapper (Clerk session)
|   |       +-- utils.ts
|   +-- index.html
|   +-- vite.config.js
|   +-- package.json
|
+-- docs/                            <- All documentation
|   +-- PRD.md                       <- Product Requirements Document
|   +-- SRS.md                       <- Software Requirements Specification
|   +-- ARCHITECTURE.md              <- System Architecture Document
|   +-- PROJECT_STRUCTURE.md         <- Full project layout + auth decision
|   +-- SDK_GUIDE.md                 <- SDK implementation guide
|
+-- HTML UI Screens/                 <- UI mockups / prototypes
|
+-- pnpm-workspace.yaml
+-- turbo.json
+-- README.md                        <- this file
```

---

## 5. Environment Variables

Copy the example and fill in your keys:

```bash
cp .env.example server/.env
```

| Variable | Used by | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | server | YES | Postgres connection string |
| `REDIS_URL` | server | YES | Redis connection string |
| `CLERK_SECRET_KEY` | server | YES | Clerk server-side secret |
| `VITE_CLERK_PUBLISHABLE_KEY` | client | YES | Clerk publishable key for React |
| `SERPER_API_KEY` | server | YES | Serper.dev API key |
| `OPENAI_API_KEY` | server | YES | LLM provider (planner + synthesis) |
| `PORT` | server | NO | Default: `5000` |
| `VITE_API_URL` | client | NO | Points client at server. Default: `http://localhost:5000` |
| `NODE_ENV` | server | NO | `development` / `production` |

### `.env.example`

```bash
# -- Database --------------------------------------------------
DATABASE_URL=postgresql://user:password@localhost:5432/sequential

# -- Redis -----------------------------------------------------
REDIS_URL=redis://localhost:6379

# -- Clerk (auth for dashboard) --------------------------------
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# -- External services -----------------------------------------
SERPER_API_KEY=...
OPENAI_API_KEY=sk-...

# -- Server ----------------------------------------------------
PORT=5000
NODE_ENV=development

# -- Client ----------------------------------------------------
VITE_API_URL=http://localhost:5000
```

---

## 6. Setup Guide

### Step 1 - Clone & Install

```bash
git clone https://github.com/sequential-ai/sequential
cd sequential

# Install all workspace dependencies
pnpm install
```

### Step 2 - Start Postgres + Redis (Docker)

```bash
docker compose up -d
```

`docker-compose.yml` (development):

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

### Step 3 - Configure Environment

```bash
cp .env.example server/.env
# Fill in: DATABASE_URL, REDIS_URL, CLERK_SECRET_KEY, SERPER_API_KEY, OPENAI_API_KEY
```

### Step 4 - Run Database Migrations

```bash
pnpm --filter server db:migrate
```

### Step 5 - Start All Development Servers

```bash
pnpm dev
```

This starts everything in parallel via Turborepo:

| Process | Port | Command |
|---|---|---|
| Server (API) | `5000` | `nodemon app.js` |
| Client (Dashboard) | `5173` | `vite` |
| SDK (watch mode) | - | `tsup --watch` |

---

## 7. Available Commands

### Root (Turborepo - runs across all packages)

```bash
pnpm dev          # Start all services in development mode
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm typecheck    # TypeScript typecheck all packages
```

### Server only

```bash
# From repo root:
pnpm --filter server dev

# Or from /server:
cd server
pnpm dev          # nodemon app.js
```

### Client only

```bash
# From repo root:
pnpm --filter client dev

# Or from /client:
cd client
pnpm dev          # vite (port 5173)
pnpm build        # production build
pnpm preview      # preview production build
pnpm lint         # ESLint
```

### SDK only

```bash
cd packages/sdk
pnpm build        # tsup build (CJS + ESM output)
pnpm dev          # tsup --watch
pnpm test         # run SDK tests
```

---

## 8. API Overview

All API routes are under `/v1/` and require an API key:

```
Authorization: Bearer sk_live_...
```

| Method | Route | Description |
|---|---|---|
| `POST` | `/v1/task` | Submit a research task |
| `GET` | `/v1/task/:id` | Get task status + result |
| `GET` | `/v1/monitor/:id` | Stream live task trace (SSE) |
| `POST` | `/v1/search` | Run a single parallel search |
| `POST` | `/v1/extract` | Extract content from a URL |
| `GET` | `/v1/memory` | Query memory store |
| `POST` | `/v1/memory` | Store a memory entry |
| `GET` | `/v1/interactions` | List API interactions / usage |
| `GET` | `/v1/keys` | List API keys |
| `POST` | `/v1/keys` | Create an API key |
| `DELETE` | `/v1/keys/:id` | Revoke an API key |

Dashboard routes (`/api/dashboard/*`) are Clerk session protected.

### Health Check

```bash
GET /
```

```json
{
  "message": "success",
  "data": {
    "name": "Sequential",
    "version": "1.0.0"
  }
}
```

---

## 9. Auth Architecture

Sequential AI uses **two separate auth paths**:

```
Browser (Dashboard)
  |  Cookie session (Clerk-managed JWT)
  v
clerkMiddleware() -> verifies session -> attaches userId
  |
  v
/api/dashboard/* routes

-------------------------------------------------------

SDK / curl / Agent
  |  Authorization: Bearer sk_live_...
  v
apiKeyMiddleware() -> hash key -> lookup in Postgres -> orgId
  |
  v
/v1/* routes
```

- **Dashboard auth** - Clerk (handles sessions, OAuth, MFA, org management)
- **API auth** - Custom Postgres-backed API keys (Sequential's own product)

### Postgres tables owned by Sequential AI

```sql
users        (clerkUserId TEXT PK, email, createdAt)
orgs         (clerkOrgId TEXT PK, name, plan, createdAt)
org_members  (clerkOrgId, clerkUserId, role)
api_keys     (id, orgId FK, keyHash, name, scopes, createdAt, revokedAt)
```

---

## 10. Documentation

All documentation lives in `/docs/`:

| Document | Description |
|---|---|
| `PRD.md` | Product Requirements Document - features, personas, pricing |
| `SRS.md` | Software Requirements Specification - detailed requirements |
| `ARCHITECTURE.md` | System Architecture - component design, data models, scalability |
| `PROJECT_STRUCTURE.md` | Full project layout + auth decision rationale |
| `SDK_GUIDE.md` | SDK implementation guide for developers |

---

## 11. Deployment

| Package | How deployed |
|---|---|
| `server` | Docker container -> Railway / Render / EC2 |
| `client` | Static build -> Vercel / Netlify (auto-deploy on merge to `main`) |
| `packages/sdk` | npm publish (triggered by `sdk/v*` git tag) |
| Postgres | Neon (serverless + pgvector) or Railway Postgres |
| Redis | Upstash (serverless) or Railway Redis |

Workers run as **separate processes** using the same server Docker image with a different start command:

```bash
node dist/workers/index.js
```

---

## Decision Log

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo vs. multi-repo | Monorepo (pnpm workspaces) | Type sharing between server/SDK without publishing; one CI pipeline |
| Auth: Clerk vs. custom | Clerk (dashboard) | Ships auth in a day; org model maps perfectly; not a differentiator |
| API key auth | Custom (Postgres-backed) | API keys are Sequential's own product; Clerk does not manage them |
| Database | Postgres + pgvector | One DB for relational + vector; avoids separate Pinecone/Weaviate |
| Queue | Redis + BullMQ | Native fan-out; horizontal scaling; job visibility + retry built in |
| Build tool for SDK | tsup | Fastest TS bundler; dual CJS/ESM output; zero config for d.ts |
| Build orchestration | Turborepo | Cached builds; parallel task execution across packages |

---

Built with love by the Sequential AI team - Version 1.0.0
