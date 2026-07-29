# Sequential AI Node SDK

The official Node.js / TypeScript SDK for the Sequential AI API. 

## Installation

```bash
npm install @sequential-ai/sdk
# or
yarn add @sequential-ai/sdk
# or
pnpm add @sequential-ai/sdk
```

## Quick Start

```javascript
import { SequentialAI } from "@sequential-ai/sdk";

// The client automatically picks up the SEQUENTIAL_API_KEY environment variable.
const client = new SequentialAI();

async function main() {
  const task = await client.tasks.run({
    query: "Research AI regulations affecting startups",
    mode: "STANDARD",
  });

  console.log("Task Completed:", task.output.data);
}

main().catch(console.error);
```

## Authentication

The SDK will automatically use the `SEQUENTIAL_API_KEY` environment variable if available. Alternatively, you can pass the API key explicitly during initialization:

```javascript
const client = new SequentialAI({
  apiKey: "your-api-key-here",
});
```

## API Reference

### Create Task
Creates a task asynchronously without waiting for it to complete. Returns immediately with the `PENDING` task.

```javascript
const task = await client.tasks.create({
  query: "Draft a product requirements document",
  mode: "FAST",
});
console.log(task.id); // "task_xxx"
```

### Retrieve Task
Retrieves the latest state of a specific task by its ID.

```javascript
const task = await client.tasks.retrieve("task_xxx");
console.log(task.status); // "RUNNING"
```

### Run Task (High-Level)
Creates a task and polls it until it finishes (`COMPLETED` or `FAILED`). It makes the asynchronous API feel synchronous.

```javascript
const task = await client.tasks.run({
  query: "Deep dive into vector databases",
  mode: "DEEP",
  pollInterval: 2000, // Poll every 2 seconds
  timeout: 300000, // 5 minutes timeout
  onProgress: (currentTask) => {
    console.log(`Status changed: ${currentTask.status}`);
  },
});
```

## Error Handling

The SDK provides typed error classes for structured error handling:

```javascript
import { SequentialAIError, TaskFailedError, TimeoutError } from "@sequential-ai/sdk";

try {
  await client.tasks.run({ query: "Test", mode: "FAST" });
} catch (error) {
  if (error instanceof TaskFailedError) {
    console.error("Task failed to execute:", error.message, error.taskId);
  } else if (error instanceof TimeoutError) {
    console.error("Task timed out while polling");
  } else if (error instanceof SequentialAIError) {
    console.error("API error:", error.status, error.message);
  }
}
```

## Retries

The SDK automatically handles transient API errors and rate limits with exponential backoff. It will safely retry requests on the following status codes: `429`, `500`, `502`, `503`, and `504`.

By default, the SDK retries 3 times. You can configure this:

```javascript
const client = new SequentialAI({
  maxRetries: 5,
});
```
