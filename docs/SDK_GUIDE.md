# Sequential AI — SDK Development Guide (npm / TypeScript)

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** July 2026  
**Scope:** TypeScript SDK only (`@sequential-ai/sdk`)

---

## Table of Contents

1. [Should the SDK live in the same repo?](#1-should-the-sdk-live-in-the-same-repo)
2. [Package overview](#2-package-overview)
3. [SDK folder structure](#3-sdk-folder-structure)
4. [Bootstrapping the package](#4-bootstrapping-the-package)
5. [Core architecture of the SDK](#5-core-architecture-of-the-sdk)
6. [Implementing each client module](#6-implementing-each-client-module)
7. [SSE / streaming with async iterators](#7-sse--streaming-with-async-iterators)
8. [Retry & back-off](#8-retry--back-off)
9. [TypeScript config & build](#9-typescript-config--build)
10. [Testing strategy](#10-testing-strategy)
11. [Publishing to npm](#11-publishing-to-npm)
12. [Versioning & changelog](#12-versioning--changelog)
13. [SDK developer checklist](#13-sdk-developer-checklist)

---

## 1. Should the SDK Live in the Same Repo?

**Short answer: separate package, same monorepo.**

Here is the decision matrix:

| Approach | Pros | Cons |
|---|---|---|
| **Fully separate repo** | Clean separation; SDK team can have its own CI/CD | Type sharing is painful; PRs that touch both API and SDK require two repos |
| **Same repo, same package** | Simple for a solo/small team | SDK consumers pull in server deps; messy `package.json`; hard to publish cleanly |
| **Monorepo — separate packages** ✅ | Shared types live in a `@sequential-ai/types` package; SDK and server are independently publishable; one CI pipeline | Slightly more Turborepo / pnpm workspaces setup upfront |

### Recommended: pnpm workspaces monorepo

```
sequential/               ← repo root
  packages/
    sdk/                  ← @sequential-ai/sdk  (published to npm)
    types/                ← @sequential-ai/types (shared, published to npm)
  server/                 ← Express API (NOT published)
  client/                 ← React dashboard (NOT published)
  docs/                   ← this document lives here
```

> **Why pnpm?** Symlinks packages together locally so `sdk` can import from `types` during development without publishing first. Turborepo on top gives you cached builds across packages.

---

## 2. Package Overview

| Property | Value |
|---|---|
| Package name | `@sequential-ai/sdk` |
| Language | TypeScript (compiled to CommonJS + ESM dual output) |
| Runtime targets | Node.js ≥ 18, modern browsers (no Node built-ins in browser path) |
| Zero runtime deps goal | HTTP: native `fetch` (Node 18+). SSE: built-in `EventSource` polyfill for Node. No Axios, no heavy deps. |
| Peer deps | None |
| Bundle size target | < 40 KB gzipped (tree-shakeable) |

---

## 3. SDK Folder Structure

```
packages/sdk/
├── src/
│   ├── index.ts                  ← public exports (barrel)
│   ├── client.ts                 ← Sequential class (main entry point)
│   ├── config.ts                 ← ClientConfig type + defaults
│   ├── http.ts                   ← base fetch wrapper (auth, retries, timeouts)
│   ├── errors.ts                 ← typed error classes
│   │
│   ├── modules/
│   │   ├── task.ts               ← client.task.*
│   │   ├── monitor.ts            ← client.monitor.*
│   │   ├── search.ts             ← client.search()
│   │   ├── extract.ts            ← client.extract()
│   │   ├── memory.ts             ← client.memory.*
│   │   └── trace.ts              ← client.task.trace()
│   │
│   ├── streaming/
│   │   ├── sse.ts                ← SSE async iterator (Node + browser)
│   │   └── types.ts              ← MonitorEvent union type
│   │
│   └── types/
│       ├── task.ts               ← TaskRunOptions, TaskResult
│       ├── search.ts             ← SearchResult
│       ├── extract.ts            ← ExtractResult
│       ├── memory.ts             ← MemoryResult
│       └── common.ts             ← ApiKey, Usage, Error envelope
│
├── tests/
│   ├── unit/
│   │   ├── http.test.ts
│   │   ├── task.test.ts
│   │   └── sse.test.ts
│   └── integration/
│       └── task.integration.test.ts  ← hits a local test server
│
├── examples/
│   ├── basic-task.ts
│   ├── monitor-stream.ts
│   └── memory-recall.ts
│
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsup.config.ts                ← build tool config (tsup = fastest TS builder)
├── vitest.config.ts
└── README.md
```

---

## 4. Bootstrapping the Package

### 4.1 `package.json`

```json
{
  "name": "@sequential-ai/sdk",
  "version": "0.1.0",
  "description": "Official TypeScript SDK for Sequential AI",
  "license": "MIT",
  "author": "Sequential AI",
  "repository": {
    "type": "git",
    "url": "https://github.com/sequential-ai/sequential"
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "@types/node": "^20.0.0",
    "eslint": "^9.0.0"
  }
}
```

> **No runtime dependencies.** `fetch` is native in Node 18+. If you need to support older environments, add `cross-fetch` as a peer dep.

### 4.2 `tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],          // dual output
  dts: true,                        // generate .d.ts
  sourcemap: true,
  clean: true,
  splitting: false,                 // simpler for a small SDK
  treeshake: true,
  target: 'es2020',
});
```

---

## 5. Core Architecture of the SDK

### 5.1 The `Sequential` Client Class

Everything is accessed through a single client instance. Do not export loose functions — this makes tree-shaking work correctly and keeps auth centralised.

```typescript
// src/client.ts
import { HttpClient } from './http';
import { TaskModule } from './modules/task';
import { MonitorModule } from './modules/monitor';
import { SearchModule } from './modules/search';
import { ExtractModule } from './modules/extract';
import { MemoryModule } from './modules/memory';
import type { ClientConfig } from './config';

export class Sequential {
  private http: HttpClient;

  public readonly task: TaskModule;
  public readonly monitor: MonitorModule;
  public readonly memory: MemoryModule;

  constructor(config: ClientConfig) {
    if (!config.apiKey) throw new Error('Sequential: apiKey is required');

    this.http = new HttpClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? 'https://api.sequential.ai/v1',
      timeout: config.timeout ?? 60_000,
      maxRetries: config.maxRetries ?? 3,
    });

    this.task = new TaskModule(this.http);
    this.monitor = new MonitorModule(this.http);
    this.memory = new MemoryModule(this.http);
  }

  /** Convenience: standalone search (no Task overhead) */
  search(query: string) {
    return new SearchModule(this.http).search(query);
  }

  /** Convenience: standalone URL extraction */
  extract(url: string) {
    return new ExtractModule(this.http).extract(url);
  }

  /** Update the API key at runtime (useful in test environments) */
  setApiKey(key: string) {
    this.http.setApiKey(key);
  }
}
```

### 5.2 `ClientConfig`

```typescript
// src/config.ts
export interface ClientConfig {
  /** Your Sequential AI API key — required */
  apiKey: string;
  /** Override the base URL (useful for self-hosted or test environments) */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default: 60_000 */
  timeout?: number;
  /** Max retry attempts on retryable errors. Default: 3 */
  maxRetries?: number;
}
```

### 5.3 `HttpClient` — The Base Fetch Wrapper

```typescript
// src/http.ts
import { SequentialError, RateLimitError, AuthError } from './errors';

interface HttpClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

export class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  setApiKey(key: string) {
    this.config.apiKey = key;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    attempt = 1,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-SDK-Version': '0.1.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        this.throwHttpError(res.status, errBody);
      }

      return res.json() as Promise<T>;
    } catch (err) {
      clearTimeout(timer);

      if (this.isRetryable(err) && attempt <= this.config.maxRetries) {
        await this.sleep(this.backoff(attempt));
        return this.request<T>(method, path, body, attempt + 1);
      }

      throw err;
    }
  }

  private throwHttpError(status: number, body: any): never {
    if (status === 401 || status === 403) throw new AuthError(body.error?.message);
    if (status === 429) throw new RateLimitError(body.error?.retryAfter);
    throw new SequentialError(body.error?.code, body.error?.message, status);
  }

  private isRetryable(err: unknown): boolean {
    if (err instanceof AuthError) return false;
    if (err instanceof SequentialError) return err.retryable;
    return true; // network errors, timeouts
  }

  private backoff(attempt: number): number {
    return Math.min(1000 * 2 ** (attempt - 1) + Math.random() * 200, 30_000);
  }

  private sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }
}
```

### 5.4 Typed Error Classes

```typescript
// src/errors.ts
export class SequentialError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly retryable: boolean;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'SequentialError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = statusCode >= 500 || statusCode === 0;
  }
}

export class AuthError extends SequentialError {
  constructor(message = 'Invalid or missing API key') {
    super('AUTH_ERROR', message, 401);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends SequentialError {
  readonly retryAfter: number;

  constructor(retryAfter = 60) {
    super('RATE_LIMIT', `Rate limited. Retry after ${retryAfter}s`, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}
```

---

## 6. Implementing Each Client Module

### 6.1 Task Module

```typescript
// src/modules/task.ts
import type { HttpClient } from '../http';
import type { TaskRunOptions, TaskResult, TraceResult } from '../types/task';

export class TaskModule {
  constructor(private http: HttpClient) {}

  /** Run a full research task (fan-out → synthesis) */
  async run(query: string, options: TaskRunOptions = {}): Promise<TaskResult> {
    return this.http.post<TaskResult>('/task', {
      query,
      maxWorkers: options.maxWorkers ?? 5,
      stream: options.stream ?? false,
    });
  }

  /** Get a completed task's result by ID */
  async get(taskId: string): Promise<TaskResult> {
    return this.http.get<TaskResult>(`/task/${taskId}`);
  }

  /** Get the full step trace for a task */
  async trace(taskId: string): Promise<TraceResult> {
    return this.http.get<TraceResult>(`/task/${taskId}/trace`);
  }
}
```

**Types:**
```typescript
// src/types/task.ts
export interface TaskRunOptions {
  maxWorkers?: number;      // 1–20, default: 5
  stream?: boolean;         // stream synthesis tokens
}

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'running';
  answer: string;
  sources: Source[];
  usage: Usage;
  createdAt: string;
  completedAt?: string;
}

export interface Source {
  url: string;
  title: string;
  excerpt: string;
  status: 'success' | 'failed' | 'excluded';
}

export interface Usage {
  workerSeconds: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}
```

### 6.2 Monitor Module

```typescript
// src/modules/monitor.ts
import type { HttpClient } from '../http';
import { createSseIterator } from '../streaming/sse';
import type { MonitorEvent } from '../streaming/types';
import type { TaskResult } from '../types/task';

export class MonitorModule {
  constructor(private http: HttpClient) {}

  /** List recent tasks */
  async list(options: { limit?: number; status?: string } = {}): Promise<TaskResult[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.status) params.set('status', options.status);
    return this.http.get(`/monitor?${params}`);
  }

  /**
   * Watch a task's real-time trace.
   * Returns an async iterator of MonitorEvent objects.
   *
   * @example
   * for await (const event of client.monitor.watch(taskId)) {
   *   console.log(event.type, event.payload);
   * }
   */
  watch(taskId: string): AsyncIterable<MonitorEvent> {
    const url = `${this.http.baseUrl}/monitor/${taskId}`;
    const headers = { Authorization: `Bearer ${this.http.apiKey}` };
    return createSseIterator(url, headers);
  }
}
```

---

## 7. SSE / Streaming with Async Iterators

This is the most technically interesting part of the SDK. The `monitor.watch()` method must:

1. Open an SSE connection to the server
2. Parse each `data:` line into a typed `MonitorEvent`
3. Yield events to the caller via `for await`
4. Close the connection cleanly when the caller breaks the loop or the stream ends

### 7.1 The SSE Iterator

```typescript
// src/streaming/sse.ts

/**
 * Creates an async iterator over an SSE stream.
 * Works in Node 18+ (native fetch + ReadableStream) and modern browsers.
 */
export async function* createSseIterator<T>(
  url: string,
  headers: Record<string, string>,
): AsyncIterable<T> {
  const response = await fetch(url, {
    headers: {
      ...headers,
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE connection failed: ${response.status}`);
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader();

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += value;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';  // keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') return;
          try {
            yield JSON.parse(raw) as T;
          } catch {
            // skip malformed lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### 7.2 Monitor Event Types

```typescript
// src/streaming/types.ts
export type MonitorEventType =
  | 'plan'
  | 'search_start'
  | 'search_result'
  | 'extract_start'
  | 'extract_result'
  | 'summary'
  | 'synthesis_start'
  | 'synthesis_chunk'
  | 'done'
  | 'error';

export interface MonitorEvent {
  type: MonitorEventType;
  taskId: string;
  stepId: string;
  timestamp: string;
  payload: unknown;  // typed per event type in practice
}
```

### 7.3 Usage Example

```typescript
const result = await client.task.run('Latest fusion energy breakthroughs', {
  maxWorkers: 10,
});

for await (const event of client.monitor.watch(result.taskId)) {
  switch (event.type) {
    case 'plan':
      console.log('Plan:', event.payload);
      break;
    case 'search_result':
      console.log('Found sources:', event.payload);
      break;
    case 'synthesis_chunk':
      process.stdout.write(event.payload as string);
      break;
    case 'done':
      console.log('\nTask complete.');
      return;
  }
}
```

---

## 8. Retry & Back-Off

The retry logic lives in `HttpClient` (shown in §5.3). Key points:

| Scenario | Behaviour |
|---|---|
| 5xx server error | Retry up to `maxRetries` times with exponential back-off + jitter |
| 429 rate limit | Retry after `retryAfter` seconds from response header |
| 401/403 auth error | Fail immediately — do not retry |
| Network timeout | Retry up to `maxRetries` times |
| SSE disconnection | **Not** handled in v1; caller should restart the iterator. Add auto-reconnect with `Last-Event-ID` in v2. |

**Back-off formula:**
```
delay = min(1000 × 2^(attempt - 1) + rand(0, 200), 30_000)   ms
```

---

## 9. TypeScript Config & Build

### `tsconfig.json` (development)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### `tsconfig.build.json` (production, used by tsup)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": false
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit tests (Vitest)

Mock `fetch` globally and test each module in isolation.

```typescript
// tests/unit/task.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sequential } from '../../src';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('TaskModule', () => {
  let client: Sequential;

  beforeEach(() => {
    client = new Sequential({ apiKey: 'test-key' });
    mockFetch.mockReset();
  });

  it('sends POST /task with correct body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        taskId: 'task_123',
        status: 'completed',
        answer: 'Test answer',
        sources: [],
        usage: { workerSeconds: 10, tokensIn: 100, tokensOut: 200, cost: 0 },
      }),
    });

    const result = await client.task.run('test query', { maxWorkers: 3 });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.sequential.ai/v1/task',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ query: 'test query', maxWorkers: 3, stream: false }),
      }),
    );

    expect(result.taskId).toBe('task_123');
  });

  it('throws AuthError on 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'AUTH_ERROR', message: 'Invalid key' } }),
    });

    await expect(client.task.run('test')).rejects.toThrow('Invalid key');
  });
});
```

### 10.2 SSE streaming tests

```typescript
// tests/unit/sse.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createSseIterator } from '../../src/streaming/sse';

function makeStream(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

describe('createSseIterator', () => {
  it('yields parsed events from SSE stream', async () => {
    const body = makeStream([
      'data: {"type":"plan","taskId":"t1","stepId":"s1","timestamp":"","payload":{}}\n\n',
      'data: [DONE]\n\n',
    ]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body }));

    const events = [];
    for await (const e of createSseIterator('http://test/monitor/t1', {})) {
      events.push(e);
    }

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('plan');
  });
});
```

### 10.3 Integration tests

Run against a real local server (or a test fixture server) using `vitest` with an environment variable flag:

```bash
SEQUENTIAL_API_KEY=test_key SEQUENTIAL_BASE_URL=http://localhost:3000/v1 \
  vitest run tests/integration
```

---

## 11. Publishing to npm

### 11.1 Setup

1. Create an npm account and enable 2FA.
2. Create an npm org: `sequential-ai` (matches `@sequential-ai/sdk`).
3. Add `NPM_TOKEN` to your CI secrets.

### 11.2 `.npmrc` (in the sdk package root)

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
access=public
```

### 11.3 CI publish workflow (GitHub Actions)

```yaml
# .github/workflows/publish-sdk.yml
name: Publish SDK

on:
  push:
    tags:
      - 'sdk/v*'   # trigger on tags like sdk/v0.1.0

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @sequential-ai/sdk build
      - run: pnpm --filter @sequential-ai/sdk test
      
      - name: Publish to npm
        run: pnpm --filter @sequential-ai/sdk publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 11.4 Tagging convention

```bash
# Bump version in packages/sdk/package.json first, then:
git tag sdk/v0.2.0
git push origin sdk/v0.2.0
```

---

## 12. Versioning & Changelog

- Follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`).
- Use **Conventional Commits** in commit messages (`feat:`, `fix:`, `breaking:`).
- Use `changesets` to manage changelog entries across the monorepo:

```bash
pnpm add -D @changesets/cli -w
pnpm changeset init

# When making a change:
pnpm changeset          # describe what changed and bump type
pnpm changeset version  # applies version bumps + updates CHANGELOG.md
pnpm changeset publish  # publishes changed packages
```

---

## 13. SDK Developer Checklist

Before releasing any version, verify:

- [ ] `client.task.run()` returns a typed `TaskResult`
- [ ] `client.monitor.watch()` works with `for await` in Node 18 and Chrome
- [ ] `client.search()` and `client.extract()` return typed results
- [ ] `client.memory.recall()` returns ranked results with scores
- [ ] Auth errors (`401`) throw `AuthError` — not a generic error
- [ ] Rate limit errors (`429`) throw `RateLimitError` with `retryAfter`
- [ ] Retries fire on `5xx` but not on `4xx`
- [ ] Timeout aborts the request after the configured `timeout` ms
- [ ] ESM import works: `import { Sequential } from '@sequential-ai/sdk'`
- [ ] CJS require works: `const { Sequential } = require('@sequential-ai/sdk')`
- [ ] `d.ts` types are included in the published package
- [ ] `package.json` `exports` field covers `import`, `require`, and `types`
- [ ] README has a working quickstart code block
- [ ] `CHANGELOG.md` updated
- [ ] All unit tests pass
- [ ] Bundle size < 40 KB gzipped (check with `npx bundlephobia`)
