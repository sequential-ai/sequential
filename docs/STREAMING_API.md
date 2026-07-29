# Sequential AI - Task Streaming Architecture (Production Implementation)

You are the Lead Staff Engineer for Sequential AI.

Your task is to redesign the Task API to support **real-time streaming** for all task executions.

This is **NOT** just token streaming like OpenAI.

The system must stream the **entire execution lifecycle** of a research task.

The implementation must be scalable, event-driven, resumable, and production-ready.

---

# Primary Goals

Implement a streaming architecture that:

* Streams every stage of task execution
* Uses Server-Sent Events (SSE)
* Is built around an Event Bus
* Supports reconnecting clients
* Supports future WebSocket integration
* Supports Monitor API
* Supports Agent Graph visualization
* Supports task replay
* Supports live dashboards

---

# High-Level Architecture

```
Client

↓

POST /v1/tasks (Create) & GET /v1/tasks/:id/stream (Subscribe)

↓

Task Service

↓

Planner

↓

Search

↓

Extract

↓

Rank

↓

Fact Extraction

↓

Synthesis

↓

Output Validation

↓

Completed
```

Every stage publishes events.

Workers NEVER communicate directly with SSE.

Instead

```
Worker

↓

Event Bus

↓

Streaming Gateway

↓

Client
```

---

# Streaming Protocol

Implement Server-Sent Events.

Endpoints

1. Create Task
```
POST /v1/tasks
```
Response: `{ "taskId": "...", "status": "pending" }`

2. Stream Events
```
GET /v1/tasks/:id/stream
```

Response

```
Content-Type: text/event-stream
```

Keep connection alive until task finishes.

---

# Event Bus

Create a centralized Event Bus.

Every worker publishes events.

Never allow workers to know about SSE.

Architecture

```
Planner

↓

EventBus.publish()

↓

Redis Pub/Sub

↓

Streaming Gateway

↓

Browser
```

The Event Bus must support future integrations:

* WebSocket
* Kafka
* NATS
* RabbitMQ
* BullMQ
* Monitor API
* Analytics

without changing worker code.

---

# Event Model

Create a unified event interface.

```ts
interface TaskEvent {

    id:string

    taskId:string

    sequence:number

    timestamp:string

    type:string

    workerId?:string

    payload:any

}
```

Sequence numbers are mandatory.

They allow replay after reconnect.

---

# Supported Event Types

Implement the following events.

Task

```
task.created

task.started

task.completed

task.failed

task.cancelled
```

Planner

```
planner.started

planner.completed
```

Search

```
search.started

search.progress

search.result

search.completed
```

Extraction

```
extract.started

extract.progress

extract.completed
```

Ranking

```
rank.started

rank.completed
```

Fact Extraction

```
facts.started

facts.found

facts.completed
```

Synthesis

```
synthesis.started

synthesis.delta

synthesis.completed
```

Structured JSON

```
json.delta
```

Output

```
output.validated

output.completed
```

Metrics

```
metrics.updated
```

Cost

```
cost.updated
```

Heartbeat

```
heartbeat
```

Error

```
worker.error
```

---

# Event Payloads

Every event must contain meaningful data.

Example

Planner

```json
{
  "type":"planner.completed",

  "payload":{

      "subQueries":[...]

  }
}
```

Search Progress

```json
{
  "type":"search.progress",

  "payload":{

      "completed":4,

      "total":12

  }
}
```

Search Result

```json
{
  "type":"search.result",

  "payload":{

      "url":"...",

      "title":"...",

      "domain":"..."
  }
}
```

Fact Found

```json
{
  "type":"facts.found",

  "payload":{

      "fact":"React Server Components render on the server.",

      "sourceId":"src_3"
  }
}
```

Answer Delta

```json
{
  "type":"synthesis.delta",

  "payload":{

      "delta":"React "
  }
}
```

JSON Delta

```json
{
  "type":"json.delta",

  "payload":{

      "path":"company.name",

      "value":"OpenAI"
  }
}
```

Completed

```json
{
  "type":"task.completed",

  "payload":{

      "output":{...}

  }
}
```

---

# Streaming Gateway

Create a dedicated Streaming Gateway.

Responsibilities

* Subscribe to Event Bus
* Push SSE messages
* Track connected clients
* Support reconnects
* Maintain event ordering
* Send heartbeat events
* Close connections after completion

Workers must never interact with clients directly.

---

# Event Persistence

Create TaskEvent database table.

```
TaskEvent

id

taskId

sequence

type

workerId

payload

createdAt
```

Every published event is stored.

This enables

* replay
* debugging
* timeline
* analytics
* observability

---

# Replay API

Implement

```
GET /v1/tasks/:id/events
```

Returns all events.

Also implement

```
GET /v1/tasks/:id/events?after=124
```

Returns only events after sequence 124.

This supports browser reconnect.

---

# SSE Resume

Support Last-Event-ID.

When browser reconnects

```
Last-Event-ID: 245
```

Server sends

246

247

248

...

instead of restarting task.

---

# Heartbeats

Send

```
heartbeat
```

every 15 seconds.

Prevent proxies from closing SSE connections.

---

# Metrics Streaming

Continuously publish

```
metrics.updated
```

Payload

```
tokens

cost

workersCompleted

workersRunning

pagesExtracted

pagesSearched

factsFound
```

UI should update live.

---

# Cost Streaming

Publish

```
cost.updated
```

Whenever worker completes.

Aggregate

Planning

Search

Extraction

Synthesis

Embedding

Total

---

# Worker Streaming

Every worker automatically emits

Started

Progress

Completed

Error

Workers should inherit a common BaseWorker class.

The BaseWorker should automatically publish lifecycle events.

Individual workers only implement business logic.

---

# Task Service

The Task Service should never manually stream.

It only publishes events.

Streaming Gateway handles delivery.

---

# Client SDK

Update SDK.

Allow

```ts
client.tasks.stream(...)
```

Example

```ts
const stream = client.tasks.stream({
    query:"React 19"
});

stream.on("planner.completed",...)

stream.on("search.progress",...)

stream.on("facts.found",...)

stream.on("synthesis.delta",...)

stream.on("completed",...)
```

---

# Frontend Example

Live UI

```
Planning...

✓ Planner Complete

Searching...

■■□□□□□□

Found Sources

✓ react.dev

✓ github.com

Extracting Facts...

47 facts extracted

Generating Answer...

React 19 introduces...

Completed
```

---

# Future Compatibility

The architecture must support

* WebSockets
* Monitor API
* Live dashboards
* Agent Graph visualization
* Human approval
* Multi-agent orchestration
* Distributed workers
* Horizontal scaling
* Kafka
* Redis Streams
* NATS
* Replay
* Task resume

without API changes.

---

# Code Quality

Create dedicated modules.

```
/streaming

/event-bus

/sse

/events

/gateway

/task-events

/worker-events

/replay

/heartbeat
```

Avoid putting streaming logic inside workers.

Avoid coupling workers to HTTP.

Use dependency injection.

Use TypeScript interfaces.

---

# Testing

Add integration tests for

✓ SSE connection

✓ Event ordering

✓ Replay

✓ Last-Event-ID

✓ Heartbeat

✓ Worker lifecycle

✓ JSON streaming

✓ Answer streaming

✓ Connection interruption

✓ Resume

✓ Task completion

✓ Failure recovery

---

# Final Goal

The finished system should behave like a modern AI infrastructure platform rather than a simple text-streaming API. Every internal worker emits structured lifecycle events, the Streaming Gateway delivers them over SSE in order, clients can reconnect without losing progress, and the architecture is reusable by the Task API, Monitor API, dashboards, and future distributed agent orchestration.
