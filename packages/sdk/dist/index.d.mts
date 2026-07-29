interface HttpClientOptions {
    baseURL: string;
    apiKey: string;
    maxRetries: number;
}
declare class HttpClient {
    private baseURL;
    private apiKey;
    private maxRetries;
    constructor(options: HttpClientOptions);
    private handleError;
    request<T>(method: string, path: string, options?: {
        body?: any;
        headers?: Record<string, string>;
    }): Promise<T>;
    get<T>(path: string, options?: {
        headers?: Record<string, string>;
    }): Promise<T>;
    post<T>(path: string, body?: any, options?: {
        headers?: Record<string, string>;
    }): Promise<T>;
    put<T>(path: string, body?: any, options?: {
        headers?: Record<string, string>;
    }): Promise<T>;
    delete<T>(path: string, options?: {
        headers?: Record<string, string>;
    }): Promise<T>;
}

/**
 * Options for configuring the Sequential AI client.
 */
interface SequentialAIOptions {
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
type TaskStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
interface CreateTaskRequest {
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
interface Task {
    id: string;
    status: TaskStatus;
    output?: TaskOutput;
}
interface TaskOutput {
    data: Record<string, any>;
}
interface TaskExecution {
    id: string;
    taskId: string;
    startedAt: string;
    completedAt?: string;
    status: string;
}
interface WorkerRun {
    id: string;
    executionId: string;
    workerType: string;
    status: string;
    output?: any;
}
interface RunTaskOptions extends CreateTaskRequest {
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

declare class Tasks {
    private client;
    constructor(client: SequentialAI);
    /**
     * Creates a new research task.
     * @param request The task creation payload.
     * @returns The created task with status "PENDING".
     */
    create(request: CreateTaskRequest): Promise<Task>;
    /**
     * Retrieves the latest state of a task.
     * @param id The ID of the task to retrieve.
     * @returns The task object.
     */
    retrieve(id: string): Promise<Task>;
    /**
     * Retrieves a list of tasks.
     * @returns An array of tasks (if endpoint is implemented).
     */
    list(): Promise<Task[]>;
    /**
     * Cancels a running or pending task.
     * @param id The ID of the task to cancel.
     * @returns The updated task.
     */
    cancel(id: string): Promise<Task>;
    /**
     * High-level helper that creates a task and polls until completion.
     * @param options The task creation payload along with polling configuration.
     * @returns The completed task object.
     * @throws {TaskFailedError} if the task fails.
     * @throws {TimeoutError} if the task does not complete within the timeout.
     */
    run(options: RunTaskOptions): Promise<Task>;
}

declare class SequentialAI {
    apiKey: string;
    baseURL: string;
    http: HttpClient;
    tasks: Tasks;
    /**
     * Initializes a new SequentialAI client.
     * @param options Configuration options for the client.
     */
    constructor(options?: SequentialAIOptions);
}

declare class SequentialAIError extends Error {
    status?: number;
    headers?: Headers;
    body?: any;
    constructor(message: string, status?: number, body?: any, headers?: Headers);
}
declare class AuthenticationError extends SequentialAIError {
    constructor(message: string, status?: number, body?: any, headers?: Headers);
}
declare class RateLimitError extends SequentialAIError {
    constructor(message: string, status?: number, body?: any, headers?: Headers);
}
declare class TimeoutError extends SequentialAIError {
    constructor(message: string);
}
declare class TaskFailedError extends SequentialAIError {
    taskId: string;
    constructor(message: string, taskId: string, body?: any);
}
declare class ValidationError extends SequentialAIError {
    constructor(message: string, status?: number, body?: any, headers?: Headers);
}
declare class APIError extends SequentialAIError {
    constructor(message: string, status?: number, body?: any, headers?: Headers);
}

export { APIError, AuthenticationError, type CreateTaskRequest, RateLimitError, type RunTaskOptions, SequentialAI, SequentialAIError, type SequentialAIOptions, type Task, type TaskExecution, TaskFailedError, type TaskOutput, type TaskStatus, Tasks, TimeoutError, ValidationError, type WorkerRun, SequentialAI as default };
