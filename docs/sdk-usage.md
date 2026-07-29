# Sequential AI SDK Usage Guide

This guide explains how to use the `@sequential-ai/sdk` to interact with the Sequential AI platform. It covers everything from initialization to managing and streaming real-time task events.

## Installation

Install the SDK in your project:

```bash
npm install @sequential-ai/sdk
```

## Initialization

Import and initialize the `SequentialAI` client using your API key. You can also configure the `baseURL` if you are targeting a local development server or a specific environment, and adjust the `maxRetries` logic for rate limits and server errors.

```typescript
import { SequentialAI } from "@sequential-ai/sdk";

const client = new SequentialAI({
  apiKey: "YOUR_API_KEY", // Optional: defaults to process.env.SEQUENTIAL_API_KEY
  baseURL: "http://localhost:8000/api/v1", // Adjust to your backend URL
  maxRetries: 3, // Optional: defaults to 3
});
```

---

## 1. Create a Task

You can create a new research task using `client.tasks.create()`. This requires a query and an execution mode (`FAST`, `STANDARD`, or `DEEP`).

```typescript
async function createTask() {
  const task = await client.tasks.create({
    query: "Analyze recent trends in artificial intelligence.",
    mode: "FAST",
    taskSpec: { format: "markdown", maxWords: 500 } // Optional output specifications
  });

  console.log("Created Task ID:", task.id);
  console.log("Status:", task.status);
}
```

---

## 2. Get Task Status

To retrieve the latest state of a specific task, use `client.tasks.retrieve()`.

```typescript
async function checkStatus(taskId: string) {
  const task = await client.tasks.retrieve(taskId);
  
  console.log("Current Status:", task.status);
  
  if (task.status === "COMPLETED") {
    console.log("Result Output:", task.output);
    console.log("Execution Details:", task.execution);
    console.log("Sources:", task.sources);
  }
}
```

---

## 3. Stream Real-Time Task Events (Recommended)

The SDK supports **Server-Sent Events (SSE)** for real-time task updates. This is the most efficient way to track a task's progress as it executes, without polling the backend.

Use the `client.tasks.stream(id)` method, which returns an async iterator yielding real-time events.

```typescript
async function streamTaskProgress(taskId: string) {
  try {
    for await (const event of client.tasks.stream(taskId)) {
      console.log(`Received Event [${event.type}]:`, event.data);

      if (event.type === "task.completed") {
        console.log("Task finished successfully!");
        break; 
      } else if (event.type === "task.failed" || event.type === "task.cancelled") {
        console.error("Task failed or was cancelled.");
        break;
      }
    }
  } catch (error) {
    console.error("Error streaming task events:", error);
  }
}
```

### Event Payload Structure
The yielded `event` object follows this structure:
- `type`: The type of event (e.g., `task.started`, `worker.completed`, `task.completed`).
- `data`: A parsed JSON object containing the event payload (e.g., intermediate worker outputs, final answers, execution time).
- `id`: The sequence ID of the event.

---

## 4. Run and Poll (High-Level Helper)

If you prefer synchronous execution or don't want to use streaming, the SDK provides a high-level `client.tasks.run()` method. This method automatically creates the task and polls the backend until it reaches a terminal state (`COMPLETED`, `FAILED`, etc.).

```typescript
async function runTaskSynchronously() {
  try {
    const task = await client.tasks.run({
      query: "Summarize the history of the internet.",
      mode: "STANDARD",
      pollInterval: 2000, // Poll every 2 seconds
      timeout: 60000, // Timeout after 60 seconds
      onProgress: (taskState) => {
        console.log(`Polling update: Task is currently ${taskState.status}`);
      }
    });

    console.log("Final Task Output:", task.output);
  } catch (error) {
    console.error("Task run failed:", error);
  }
}
```

---

## 5. Cancel a Task

If a task is running and you need to stop it, use `client.tasks.cancel()`.

```typescript
async function stopTask(taskId: string) {
  const task = await client.tasks.cancel(taskId);
  console.log("Task status after cancellation:", task.status);
}
```

---

## Error Handling

The SDK exposes specific error classes for granular error handling. All errors inherit from the base `SequentialAIError` class. 

You can import these error classes from the SDK:

```typescript
import { 
  SequentialAIError, 
  AuthenticationError, 
  RateLimitError, 
  ValidationError,
  APIError,
  TimeoutError,
  TaskFailedError
} from "@sequential-ai/sdk";
```

### Error Types & Status Codes

| Error Class | Status Code | Description | Properties |
| --- | --- | --- | --- |
| **`SequentialAIError`** | `Any` | Base error class for all SDK errors. | `status`, `headers`, `body`, `message` |
| **`ValidationError`** | `400` | Thrown when the request payload is invalid or malformed. | Inherits from `SequentialAIError` |
| **`AuthenticationError`**| `401` / `403` | Thrown when the API key is missing, invalid, or lacks permissions. | Inherits from `SequentialAIError` |
| **`RateLimitError`** | `429` | Thrown when you exceed your rate limits. SDK automatically retries these up to `maxRetries`. | Inherits from `SequentialAIError` |
| **`APIError`** | `>= 500`| Thrown when the Sequential AI servers encounter an internal error. | Inherits from `SequentialAIError` |
| **`TimeoutError`** | N/A | Thrown by `client.tasks.run()` if the task does not complete within the specified `timeout`. | `message` |
| **`TaskFailedError`** | N/A | Thrown by `client.tasks.run()` if the polled task reaches a `FAILED` state. | `taskId`, `body` |

### Example Error Handling

```typescript
try {
  await client.tasks.create({ query: "Test", mode: "INVALID_MODE" as any });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Bad Request (400):", error.body);
  } else if (error instanceof AuthenticationError) {
    console.error("Unauthorized (401/403). Check your API Key.");
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded (429). Please back off.");
  } else if (error instanceof SequentialAIError) {
    console.error(`API Error (${error.status}):`, error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```
