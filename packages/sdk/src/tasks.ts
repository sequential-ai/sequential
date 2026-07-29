import { SequentialAI } from "./client";
import { TaskPoller } from "./poller";
import { CreateTaskRequest, RunTaskOptions, Task } from "./types";

export class Tasks {
  private client: SequentialAI;

  constructor(client: SequentialAI) {
    this.client = client;
  }

  /**
   * Creates a new research task.
   * @param request The task creation payload.
   * @returns The created task with status "PENDING".
   */
  public async create(request: CreateTaskRequest): Promise<Task> {
    return this.client.http.post<Task>("/tasks", request);
  }

  /**
   * Retrieves the latest state of a task.
   * @param id The ID of the task to retrieve.
   * @returns The task object.
   */
  public async retrieve(id: string): Promise<Task> {
    return this.client.http.get<Task>(`/tasks/${id}`);
  }

  /**
   * Retrieves a list of tasks.
   * @returns An array of tasks (if endpoint is implemented).
   */
  public async list(): Promise<Task[]> {
    return this.client.http.get<Task[]>("/tasks");
  }

  /**
   * Cancels a running or pending task.
   * @param id The ID of the task to cancel.
   * @returns The updated task.
   */
  public async cancel(id: string): Promise<Task> {
    return this.client.http.post<Task>(`/tasks/${id}/cancel`);
  }

  /**
   * Streams task events for real-time updates.
   * @param id The ID of the task to stream events for.
   * @returns An async iterable iterator of task events.
   */
  public async *stream(id: string) {
    for await (const sse of this.client.http.stream(`/tasks/${id}/stream`)) {
      if (sse.event !== 'heartbeat') {
        yield {
          type: sse.event || 'message',
          data: sse.data ? JSON.parse(sse.data) : null,
          id: sse.id,
        };
      }
    }
  }

  /**
   * High-level helper that creates a task and polls until completion.
   * @param options The task creation payload along with polling configuration.
   * @returns The completed task object.
   * @throws {TaskFailedError} if the task fails.
   * @throws {TimeoutError} if the task does not complete within the timeout.
   */
  public async run(options: RunTaskOptions): Promise<Task> {
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
      onProgress,
    });

    return poller.start();
  }
}
