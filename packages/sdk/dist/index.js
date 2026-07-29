"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  APIError: () => APIError,
  AuthenticationError: () => AuthenticationError,
  RateLimitError: () => RateLimitError,
  SequentialAI: () => SequentialAI,
  SequentialAIError: () => SequentialAIError,
  TaskFailedError: () => TaskFailedError,
  Tasks: () => Tasks,
  TimeoutError: () => TimeoutError,
  ValidationError: () => ValidationError,
  default: () => SequentialAI
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var SequentialAIError = class extends Error {
  status;
  headers;
  body;
  constructor(message, status, body, headers) {
    super(message);
    this.name = "SequentialAIError";
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
};
var AuthenticationError = class extends SequentialAIError {
  constructor(message, status, body, headers) {
    super(message, status, body, headers);
    this.name = "AuthenticationError";
  }
};
var RateLimitError = class extends SequentialAIError {
  constructor(message, status, body, headers) {
    super(message, status, body, headers);
    this.name = "RateLimitError";
  }
};
var TimeoutError = class extends SequentialAIError {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
};
var TaskFailedError = class extends SequentialAIError {
  taskId;
  constructor(message, taskId, body) {
    super(message, void 0, body);
    this.name = "TaskFailedError";
    this.taskId = taskId;
  }
};
var ValidationError = class extends SequentialAIError {
  constructor(message, status, body, headers) {
    super(message, status, body, headers);
    this.name = "ValidationError";
  }
};
var APIError = class extends SequentialAIError {
  constructor(message, status, body, headers) {
    super(message, status, body, headers);
    this.name = "APIError";
  }
};

// src/utils.ts
var sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
var calculateExponentialBackoff = (attempt, baseDelay = 1e3, maxDelay = 1e4) => {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = delay * 0.2 * Math.random();
  return delay + jitter;
};

// src/http.ts
var HttpClient = class {
  baseURL;
  apiKey;
  maxRetries;
  constructor(options) {
    this.baseURL = options.baseURL.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.maxRetries = options.maxRetries;
  }
  async handleError(response) {
    let body = null;
    try {
      body = await response.json();
    } catch {
      try {
        body = await response.text();
      } catch {
      }
    }
    const message = body?.message || body?.error || `HTTP ${response.status}`;
    switch (response.status) {
      case 400:
        throw new ValidationError(message, response.status, body, response.headers);
      case 401:
      case 403:
        throw new AuthenticationError(message, response.status, body, response.headers);
      case 429:
        throw new RateLimitError(message, response.status, body, response.headers);
      default:
        if (response.status >= 500) {
          throw new APIError(message, response.status, body, response.headers);
        }
        throw new SequentialAIError(message, response.status, body, response.headers);
    }
  }
  async request(method, path, options) {
    const url = `${this.baseURL}${path.startsWith("/") ? path : `/${path}`}`;
    let attempt = 0;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options?.headers
    };
    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : void 0
        });
        if (response.ok) {
          if (response.status === 204) {
            return {};
          }
          return await response.json();
        }
        if ([429, 500, 502, 503, 504].includes(response.status) && attempt < this.maxRetries) {
          attempt++;
          const delay = calculateExponentialBackoff(attempt);
          await sleep(delay);
          continue;
        }
        return this.handleError(response);
      } catch (error) {
        if (attempt < this.maxRetries) {
          attempt++;
          const delay = calculateExponentialBackoff(attempt);
          await sleep(delay);
          continue;
        }
        throw new SequentialAIError(`Network error: ${error.message}`);
      }
    }
    throw new SequentialAIError("Max retries exceeded");
  }
  async get(path, options) {
    return this.request("GET", path, options);
  }
  async post(path, body, options) {
    return this.request("POST", path, { body, ...options });
  }
  async put(path, body, options) {
    return this.request("PUT", path, { body, ...options });
  }
  async delete(path, options) {
    return this.request("DELETE", path, options);
  }
};

// src/poller.ts
var TaskPoller = class {
  taskId;
  tasksResource;
  pollInterval;
  timeout;
  onProgress;
  constructor(options) {
    this.taskId = options.taskId;
    this.tasksResource = options.tasksResource;
    this.pollInterval = options.pollInterval || 1e3;
    this.timeout = options.timeout || 10 * 60 * 1e3;
    this.onProgress = options.onProgress;
  }
  async start() {
    const startTime = Date.now();
    let previousStatus = null;
    while (Date.now() - startTime < this.timeout) {
      const task = await this.tasksResource.retrieve(this.taskId);
      if (this.onProgress && task.status !== previousStatus) {
        this.onProgress(task);
        previousStatus = task.status;
      } else if (this.onProgress) {
        this.onProgress(task);
      }
      if (task.status === "COMPLETED") {
        return task;
      }
      if (task.status === "FAILED") {
        const errorBody = task.output?.data || {};
        const message = errorBody.message || "Task execution failed";
        throw new TaskFailedError(message, this.taskId, errorBody);
      }
      await sleep(this.pollInterval);
    }
    throw new TimeoutError(`Task ${this.taskId} did not complete within ${this.timeout}ms`);
  }
};

// src/tasks.ts
var Tasks = class {
  client;
  constructor(client) {
    this.client = client;
  }
  /**
   * Creates a new research task.
   * @param request The task creation payload.
   * @returns The created task with status "PENDING".
   */
  async create(request) {
    return this.client.http.post("/tasks", request);
  }
  /**
   * Retrieves the latest state of a task.
   * @param id The ID of the task to retrieve.
   * @returns The task object.
   */
  async retrieve(id) {
    return this.client.http.get(`/tasks/${id}`);
  }
  /**
   * Retrieves a list of tasks.
   * @returns An array of tasks (if endpoint is implemented).
   */
  async list() {
    return this.client.http.get("/tasks");
  }
  /**
   * Cancels a running or pending task.
   * @param id The ID of the task to cancel.
   * @returns The updated task.
   */
  async cancel(id) {
    return this.client.http.post(`/tasks/${id}/cancel`);
  }
  /**
   * High-level helper that creates a task and polls until completion.
   * @param options The task creation payload along with polling configuration.
   * @returns The completed task object.
   * @throws {TaskFailedError} if the task fails.
   * @throws {TimeoutError} if the task does not complete within the timeout.
   */
  async run(options) {
    const { pollInterval, timeout, onProgress, ...createRequest } = options;
    const task = await this.create(createRequest);
    if (onProgress) {
      onProgress(task);
    }
    const poller = new TaskPoller({
      taskId: task.id,
      tasksResource: this,
      pollInterval,
      timeout,
      onProgress
    });
    return poller.start();
  }
};

// src/client.ts
var SequentialAI = class {
  apiKey;
  baseURL;
  http;
  tasks;
  /**
   * Initializes a new SequentialAI client.
   * @param options Configuration options for the client.
   */
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.SEQUENTIAL_API_KEY || "";
    this.baseURL = options.baseURL || "https://api.sequential.ai";
    if (!this.apiKey) {
      throw new Error(
        "The SEQUENTIAL_API_KEY environment variable is missing or empty; either provide it, or instantiate the SequentialAI client with an apiKey option."
      );
    }
    this.http = new HttpClient({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      maxRetries: options.maxRetries ?? 3
    });
    this.tasks = new Tasks(this);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  APIError,
  AuthenticationError,
  RateLimitError,
  SequentialAI,
  SequentialAIError,
  TaskFailedError,
  Tasks,
  TimeoutError,
  ValidationError
});
//# sourceMappingURL=index.js.map