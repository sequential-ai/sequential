/**
 * Options for configuring the Sequential AI client.
 */
export interface SequentialAIOptions {
  /**
   * The API key for authenticating with the Sequential AI API.
   * If not provided, it defaults to process.env.SEQUENTIAL_API_KEY.
   */
  apiKey?: string;

  /**
   * The base URL for the Sequential AI API.
   * Defaults to 'https://api.sequential.ai'.
   */
  baseURL?: string;

  /**
   * Maximum number of automatic retries for rate limits and server errors.
   * Defaults to 3.
   */
  maxRetries?: number;
}

export type TaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface CreateTaskRequest {
  /**
   * The natural language query for the task.
   */
  query: string;

  /**
   * The execution mode of the task.
   */
  mode: "FAST" | "STANDARD" | "DEEP";

  /**
   * Structured output specification for the task.
   */
  taskSpec?: Record<string, any>;
}

export interface Task {
  id: string;
  status: TaskStatus;
  output?: TaskOutput;
}

export interface TaskOutput {
  data: Record<string, any>;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  startedAt: string;
  completedAt?: string;
  status: string;
}

export interface WorkerRun {
  id: string;
  executionId: string;
  workerType: string;
  status: string;
  output?: any;
}

export interface RunTaskOptions extends CreateTaskRequest {
  /**
   * The polling interval in milliseconds.
   * Defaults to 1000.
   */
  pollInterval?: number;

  /**
   * The maximum time to wait for the task to complete in milliseconds.
   * Defaults to 10 minutes (600,000 ms).
   */
  timeout?: number;

  /**
   * Callback fired whenever the task status changes or during polling.
   */
  onProgress?: (task: Task) => void;
}
