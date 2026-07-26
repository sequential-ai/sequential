# Sequential AI — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** July 2026  
**Owner:** Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Target Users & Personas](#4-target-users--personas)
5. [System Architecture Overview](#5-system-architecture-overview)
6. [Core Products & Features](#6-core-products--features)
7. [API Surface](#7-api-surface)
8. [SDK Specification](#8-sdk-specification)
9. [Dashboard & UI Requirements](#9-dashboard--ui-requirements)
10. [Pricing Model](#10-pricing-model)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Security & Compliance](#12-security--compliance)
13. [Success Metrics](#13-success-metrics)
14. [Open Questions & Future Work](#14-open-questions--future-work)

---

## 1. Executive Summary

Sequential AI is a **parallel web-research API platform** purpose-built for AI agents and agent frameworks. Rather than having an agent retrieve and process sources one at a time, Sequential AI fans a single research query out across a pool of parallel workers — each independently searching and extracting content — then synthesizes everything into a single cited answer.

The two headline products are:

| Product | What it does |
|---|---|
| **Task API** | Accepts a research query, fans it out across parallel Search + Extract workers, synthesizes an answer with citations |
| **Monitor API** | Streams a real-time trace of every step inside a running (or completed) task over SSE |

Both products are **free at baseline**. Usage-based pricing applies for persistent memory and higher worker concurrency.

---

## 2. Problem Statement

### 2.1 The Sequential Bottleneck

Today's AI agents that need to research the web do so **sequentially**: fetch one URL, extract text, move to the next. This creates three compounding problems:

1. **Latency**: A 10-source research job that takes 3 s/source = 30 s minimum, before any synthesis.
2. **Coverage gaps**: A plain HTTP fetch fails on JavaScript-rendered pages (SPAs, paywalled content, dynamic tables). Agents using `requests` or `fetch` miss a significant fraction of the modern web.
3. **Opacity**: There is no standard way for an agent operator to observe what an agent-driven research job actually did — which sources it hit, which failed, what the intermediate summaries looked like. Debugging is guesswork.

### 2.2 What Competitors Provide (and Don't)

- **Perplexity / You.com / Tavily**: Single-call research APIs — useful, but black boxes. No concurrency control, no per-step trace, no memory across calls.
- **Raw Serper / SerpAPI**: Search-only; the caller must do their own extraction.
- **Browser automation (Browserless, Playwright-as-a-service)**: Extraction-only; the caller must do their own orchestration.
- **LangChain / CrewAI tools**: Bring-your-own-key wrappers that still execute sequentially.

No existing product gives agent developers: parallelism + observability + memory + a typed SDK that handles streaming traces.

### 2.3 The Opportunity

There is a clear gap for a platform that treats **parallel research as a first-class primitive** and exposes it through a developer-grade API with full observability — the same way Stripe treated payments as a first-class primitive for payments.

---

## 3. Product Vision & Goals

### Vision

> Sequential AI is the research infrastructure layer for AI agents — the platform that lets any agent do deep, parallel, cited web research in a single API call, with full observability into what happened and memory of what it learned.

### Goals (v1)

| # | Goal | Measure |
|---|---|---|
| G1 | Make parallel research a one-line API call | Task API ships with TS + Python SDK |
| G2 | Give operators full transparency into agent research steps | Monitor API streams every step live |
| G3 | Persist research findings across calls | Memory API stores + recalls embeddings |
| G4 | Be priced so agents can call us liberally | Task + Monitor + basic Search/Extract free; metered for power use |
| G5 | Support the major agent frameworks on day one | LangChain + CrewAI integrations in Python SDK |

---

## 4. Target Users & Personas

### 4.1 Primary: Agent Developer (API-first)

- Builds AI agents or agent pipelines in Python or TypeScript
- Integrates Sequential via SDK; cares about latency, reliability, typed responses
- Needs to debug agent behaviour → Monitor API is a differentiator
- Likely already using LangChain, CrewAI, or a custom orchestration framework

### 4.2 Secondary: AI Product Team

- Building a product on top of agents (e.g., AI research assistant, competitive intel tool)
- Uses the Dashboard to monitor usage, inspect traces, and tune concurrency
- May use webhooks to pipe task results into their own backend

### 4.3 Tertiary: Researcher / Solo Builder

- Uses the Playground UI as a no-code research tool
- May not write SDK code at all; uses the dashboard's Task playground directly
- Monetised through the free tier; eventual conversion on memory/concurrency

---

## 5. System Architecture Overview

> See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full technical spec.

### 5.1 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Database | **Prisma ORM** + PostgreSQL + `pgvector` | Single source of truth for users, keys, billing, task metadata, and vector embeddings. Prisma manages schema and migrations. |
| API Server | **Express on Node.js** | Non-blocking I/O is a natural fit for a workload that is almost entirely network-bound (search, scrape, LLM calls) |
| Frontend | **React** | Powers both the marketing site and the dashboard |
| Queue | **Redis + BullMQ** | Implements the fan-out: the orchestrator enqueues jobs; a worker pool (Search, Scrape, OpenRouter, SubQuery, FactExtractor, Synthesis) pulls from the queue. |

### 5.2 External Services

| Service | Role |
|---|---|
| **Serper API** | Powers the Search tool — wraps Google search, returns ranked URLs in < 2 s |
| **Playwright (headless pool)** | Powers the Extract tool — a real browser loads each URL, handles JS rendering, returns clean text. This is why the platform claims 93% source coverage vs. plain HTTP fetches |

### 5.3 Request Lifecycle (Fan-Out Flow)

```
Client (SDK / curl / Dashboard)
  │
  ▼
API Gateway (Express)
  │  Auth check, rate-limit, log interaction
  ▼
Orchestrator (cheap/fast LLM)
  │  Decomposes query → sub-queries + tool assignments
  ▼
Redis / BullMQ Queue  ──────────────────────────────────┐
                                                        │
  ├─► SubQuery Worker → [Decomposed queries]             │
  ├─► Search Worker (Serper)  →  [URLs + excerpts]       │
  ├─► Scraper Worker (Playwright) →  [clean text]        │  N workers in parallel
  ├─► FactExtractor Worker → [extracted facts]           │
  ├─► OpenRouter Worker → [LLM processing]               │
  └─► Synthesis Worker → [final answer]                  │
        │                                                 │
        ▼  Each result summarised by a cheap model        │
  Trace Store (Postgres) ◄──── every step written live   │
        │                 ◄──── streamed via SSE ─────────┘
        ▼
  Synthesis LLM  →  cited answer
        │
        ▼
  Memory Store (pgvector)  ←  embedding of completed task
        │
  Response streams to client
```

### 5.4 Key Architectural Properties

- **Failed sources = $0**: A failed Playwright scrape is retried once, then excluded and flagged in the trace. It is never billed. This is an architectural property, not just a pricing policy.
- **Unified trace**: A task started from the Dashboard, the SDK, or a raw `curl` call all emit to the same trace store. Monitor and Trace pages read that store directly — there is no separate log pipeline.
- **pgvector, not a separate vector DB**: Keeps the operational surface small in early stages; can be migrated later if scale demands it.

---

## 6. Core Products & Features

> See [FEATURES.md](./FEATURES.md) for detailed feature specs.

### 6.1 Task API

The primary product. One call = orchestration + parallel search/extract + synthesis.

**Inputs**
- `query` (string, required) — the research question
- `maxWorkers` (integer, 1–20, default: 5) — concurrency cap
- `stream` (boolean, default: false) — if true, streams the synthesised answer as it's generated

**Outputs**
- `answer` — synthesised, cited prose
- `sources` — array of `{ url, title, excerpt, status }` objects
- `taskId` — use with Monitor API to watch the trace
- `usage` — token and worker-second counts for billing

**Behaviour**
1. Orchestrator LLM decomposes `query` into N sub-queries.
2. Each sub-query is enqueued as a job; workers pull and execute in parallel.
3. Each worker's result is summarised inline.
4. Once all (or `minCoverage`-percent of) workers complete, synthesis runs.
5. Failed workers are retried once; on second failure they are excluded.

### 6.2 Monitor API

Streams the real-time trace of a task as Server-Sent Events (SSE).

**Endpoint:** `GET /v1/monitor/:taskId`

**Event types emitted:**

| Event | Payload |
|---|---|
| `plan` | Orchestrator's sub-query decomposition |
| `search_start` | Sub-query dispatched to Serper |
| `search_result` | Ranked URL list returned |
| `extract_start` | URL dispatched to Playwright worker |
| `extract_result` | Clean text returned (or error) |
| `summary` | Per-worker inline summary |
| `synthesis_start` | Synthesis LLM invoked |
| `synthesis_chunk` | Streamed token from synthesis |
| `done` | Task complete with final metadata |
| `error` | Worker or synthesis failure |

**SDK shape:**
```typescript
for await (const event of client.monitor.watch(taskId)) {
  console.log(event.type, event.payload);
}
```

### 6.3 Search API

Thin, direct wrapper around Serper. No orchestration; returns raw search results.

**Use case:** When a caller wants ranked URLs + excerpts without the full Task pipeline.

**Endpoint:** `POST /v1/search`  
**Response:** Array of `{ url, title, excerpt, rank }`, typically < 5 s.

### 6.4 Extract API

Direct Playwright extraction. No search; accepts a URL, returns clean text.

**Use case:** Caller already has a URL and wants content without a full Task.

**Endpoint:** `POST /v1/extract`  
**Behaviour:** Playwright worker loads the page in a sandboxed, isolated context, waits for render, pulls text and tables, returns with a per-request timeout.

### 6.5 Memory API

Vector search over `pgvector`, scoped to the caller's organisation.

**Endpoint:** `POST /v1/memory/query`  
**Input:** `query` string  
**Output:** Ranked past-task results with similarity scores

**How memory is populated:** At the end of every completed Task, the synthesised answer is embedded and written to the `pgvector` store automatically. No explicit "save" call required.

### 6.6 Trace API

Returns the full step-by-step tree for a completed task, straight from Postgres. Exportable.

**Endpoint:** `GET /v1/task/:id/trace`

---

## 7. API Surface

> See [API_REFERENCE.md](./API_REFERENCE.md) for full endpoint specs with request/response schemas.

### 7.1 Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/task` | Run a research task |
| `GET` | `/v1/task/:id` | Get task result |
| `GET` | `/v1/task/:id/trace` | Get full step trace |
| `GET` | `/v1/monitor/:id` | SSE stream of task events |
| `POST` | `/v1/search` | Search (Serper) |
| `POST` | `/v1/extract` | Extract (Playwright) |
| `POST` | `/v1/memory/query` | Vector memory recall |
| `GET` | `/v1/interactions` | Usage history |
| `POST` | `/v1/keys` | Create API key |
| `DELETE` | `/v1/keys/:id` | Revoke API key |

### 7.2 Auth

All requests require a single `Authorization: Bearer <api-key>` header. API keys are org-scoped and created via the Dashboard or `POST /v1/keys`.

### 7.3 Versioning

All endpoints are prefixed `/v1/`. Breaking changes bump the version prefix. The SDK targets the current stable version.

### 7.4 Error Handling

Standard HTTP status codes + a JSON error envelope:
```json
{
  "error": {
    "code": "WORKER_TIMEOUT",
    "message": "Extract worker timed out after 30s",
    "taskId": "task_abc123",
    "retryable": true
  }
}
```

---

## 8. SDK Specification

> See [SDK.md](./SDK.md) for the full SDK design document.

### 8.1 TypeScript SDK (primary)

Works in both Node.js and browser contexts. Generated from the OpenAPI spec.

```typescript
import { Sequential } from '@sequential-ai/sdk';

const client = new Sequential({ apiKey: 'sk-...' });

// Run a research task
const result = await client.task.run('What are the latest breakthroughs in fusion energy?', {
  maxWorkers: 10,
  stream: true,
});

// Watch a task live
for await (const event of client.monitor.watch(result.taskId)) {
  console.log(event.type, event.payload);
}

// Standalone search
const results = await client.search('fusion energy news 2026');

// Standalone extract
const content = await client.extract('https://example.com/article');

// Memory recall
const memories = await client.memory.recall('fusion energy');
```

**Design principles:**
- Retries + exponential backoff built in; callers don't hand-roll this
- `monitor.watch()` returns an async iterator — no manual WebSocket/SSE handling
- Fully typed responses; OpenAPI spec generates types

### 8.2 Python SDK (secondary)

Targets the LangChain / CrewAI ecosystem. Thin; same shape as the TS SDK.

```python
from sequential_ai import Sequential

client = Sequential(api_key="sk-...")

result = client.task.run("What are the latest breakthroughs in fusion energy?", max_workers=10)

for event in client.monitor.watch(result.task_id):
    print(event.type, event.payload)
```

**LangChain tool wrappers** ship in the same package:
```python
from sequential_ai.langchain import SequentialSearchTool, SequentialTaskTool
```

---

## 9. Dashboard & UI Requirements

> See [DASHBOARD.md](./DASHBOARD.md) for full UI specs and wireframe descriptions.

### 9.1 Navigation Structure

```
Sequential Dashboard
├── Playground
│   ├── Task          — Run a task, watch live trace, see result
│   ├── Monitor       — List live/past tasks; click into real-time trace
│   ├── Memory        — Searchable log of past task embeddings
│   └── Trace         — Full step tree for any task; exportable
├── Web Tools
│   ├── Search        — Query box → ranked URL results
│   └── Extract       — URL input → clean text output
└── Workspace
    ├── Workers       — Active workers, per-task concurrency, retry/timeout config
    ├── Interactions  — Full history of every API call; filterable
    └── Configure     — API keys, webhooks, org members, billing
```

### 9.2 Page Requirements

#### Task Playground
- Prompt input box with `maxWorkers` slider
- Live trace panel (SSE-driven) showing each plan/search/scrape/model event as it arrives
- Final answer rendered in Markdown with inline citations
- "Copy as SDK call" button that emits the equivalent `client.task.run()` call

#### Monitor
- List view of all tasks (live + completed), sorted by recency
- Status badges: `running`, `completed`, `failed`
- Click any task → opens real-time trace panel (same SSE stream as SDK)
- Filter by date range, status, worker count

#### Trace
- Tree view of every step: plan → search → extract → summary → synthesis
- Each node shows: step type, duration, input, output (expandable), status
- Export as JSON

#### Workers
- Current active worker count (live)
- Per-task concurrency setting (default: 5, max: 20 on paid plan)
- Retry policy: attempts, timeout per worker (in seconds)
- Worker pool health indicator

#### Interactions
- Table: timestamp, endpoint called, query, status, tokens used, cost
- Filterable by: endpoint, date, status
- Exportable as CSV

---

## 10. Pricing Model

> See [PRICING.md](./PRICING.md) for the full pricing breakdown.

### 10.1 Free Tier

| Feature | Free Tier Limit |
|---|---|
| Task API | Unlimited calls |
| Monitor API | Unlimited |
| Search API | Unlimited |
| Extract API | Unlimited |
| Memory API | First 1,000 stored embeddings |
| Max workers per task | 5 |
| Trace retention | 7 days |

### 10.2 Usage-Based Pricing (Metered)

| Resource | Rate |
|---|---|
| Workers 6–20 per task | $0.002 per worker-second |
| Memory beyond 1,000 embeddings | $0.001 per embedding/month |
| Trace retention > 7 days | $0.005 per task/month |
| Webhooks | $0.0001 per delivery |

### 10.3 Pricing Principles

1. **Failed requests are free.** A task worker that fails after retries is not billed. This is enforced at the infrastructure layer: the billing event is only written when a worker completes successfully.
2. **Search + Extract are always free.** These are priced as acquisition tools; the margin is in Task synthesis and Memory.
3. **Concurrency is the primary monetisation lever.** Most agent use-cases start on the free 5-worker limit; as research jobs grow in scope, upgrading concurrency is the natural next step.

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Metric | Target |
|---|---|
| Search API P95 latency | < 3 s |
| Extract API P95 latency (simple page) | < 8 s |
| Task API P95 latency (5 workers, simple query) | < 20 s |
| Monitor SSE first-event latency | < 500 ms after task start |
| API gateway P99 latency (non-LLM endpoints) | < 200 ms |

### 11.2 Reliability

| Metric | Target |
|---|---|
| API uptime | 99.9% monthly |
| Worker retry success rate | > 80% of first-attempt failures resolved on retry |
| Source coverage (Playwright vs. HTTP fetch) | > 90% |

### 11.3 Scalability

- Worker pool must scale horizontally; adding workers requires no code changes — BullMQ consumers are stateless.
- Postgres can handle early-scale load; pgvector index should be pre-built with `ivfflat` for query performance.
- Redis must be configured with AOF persistence to survive restarts without queue loss.

### 11.4 Developer Experience

- SDK setup to first working `task.run()` call: < 5 minutes.
- All SDK methods fully typed; no `any` in the public API surface.
- Errors are always structured JSON with a `retryable` field.
- `monitor.watch()` works with a simple `for await` — no SSE library needed by the caller.

---

## 12. Security & Compliance

### 12.1 Authentication & Authorisation

- All API requests require a Bearer token (API key).
- API keys are org-scoped. A key cannot access another org's tasks, memory, or interactions.
- Keys can be scoped to specific endpoints (e.g., read-only keys for monitoring).
- Keys can be revoked instantly via Dashboard or API.

### 12.2 Data Isolation

- All Postgres queries are org-scoped at the query layer (Row Level Security enabled on sensitive tables).
- Memory embeddings are partitioned by `org_id`; vector search cannot cross org boundaries.
- Playwright workers run in isolated, ephemeral sandboxes — one scrape cannot access another's session.

### 12.3 Data Retention

- Task traces: 7 days (free), configurable on paid plans.
- Memory embeddings: until deleted by the user or org.
- Interaction logs: 90 days by default.

### 12.4 Secrets

- API keys are stored hashed (bcrypt); the plaintext is shown once at creation.
- LLM provider keys and Serper keys are stored as environment secrets, never in the database.

---

## 13. Success Metrics

### 13.1 Acquisition

| Metric | 90-Day Target |
|---|---|
| Registered developer accounts | 500 |
| SDK installs (npm + PyPI combined) | 1,000 |
| Docs page unique visitors/month | 2,000 |

### 13.2 Activation

| Metric | 90-Day Target |
|---|---|
| % of signups who run a Task within 24 h | > 40% |
| % of signups who run > 5 tasks | > 20% |

### 13.3 Retention & Monetisation

| Metric | 90-Day Target |
|---|---|
| Weekly active API users | 100 |
| Paid conversions (any metered usage) | 25 |
| Average metered revenue per paying account | $30/month |

### 13.4 Quality

| Metric | Target |
|---|---|
| Source coverage rate | > 90% |
| Failed-task rate (task fails entirely, not just a worker) | < 2% |
| SDK bug reports blocking usage | 0 open P0 |

---

## 14. Open Questions & Future Work

### 14.1 Open Questions

| # | Question | Owner | Priority |
|---|---|---|---|
| Q1 | What is the max sensible `maxWorkers` ceiling on the free tier? 5 is a starting point — is it too restrictive to be useful? | Product | High |
| Q2 | Should `monitor.watch()` support watching a *recurring* check (not just a one-off task)? The Monitor API description hints at this but it's not in the current spec. | Product | Medium |
| Q3 | Should the Memory API support explicit `memory.save(text)` calls, or only auto-save from completed Tasks? | Product | Medium |
| Q4 | How do we handle Playwright extractions on sites that actively block headless browsers (Cloudflare, bot-detect)? | Engineering | High |
| Q5 | What's the cold-start time for a new Playwright worker? Does this create latency spikes? | Engineering | High |

### 14.2 Future Work (Post-v1)

| Feature | Description | Priority |
|---|---|---|
| **Recurring Monitor** | Schedule a task to re-run on a cron interval; Monitor streams diffs between runs | High |
| **Custom tool plugins** | Let callers register their own tools (e.g., a proprietary database query) that the orchestrator can dispatch to | High |
| **Structured output** | Task API option to return JSON matching a caller-provided schema instead of prose | Medium |
| **Streaming synthesis** | Task stream=true is in scope for v1; make it the default | Medium |
| **Team memory** | Shared memory pools across org members, with access controls | Medium |
| **LlamaIndex integration** | Python SDK LlamaIndex tool wrappers (alongside LangChain) | Medium |
| **Webhook delivery retries** | Retry failed webhook deliveries with backoff | Low |
| **EU data residency** | Offer a `region=eu` param that pins Postgres + Redis to EU infrastructure | Low |

---

*End of PRD v1.0*
