import { TaskFailedError, TimeoutError } from "./errors";
import { Task } from "./types";
import { sleep } from "./utils";
import { Tasks } from "./tasks";

export interface PollerOptions {
  taskId: string;
  tasksResource: Tasks;
  pollInterval?: number;
  timeout?: number;
  onProgress?: (task: Task) => void;
}

export class TaskPoller {
  private taskId: string;
  private tasksResource: Tasks;
  private pollInterval: number;
  private timeout: number;
  private onProgress?: (task: Task) => void;

  constructor(options: PollerOptions) {
    this.taskId = options.taskId;
    this.tasksResource = options.tasksResource;
    this.pollInterval = options.pollInterval || 1000;
    this.timeout = options.timeout || 10 * 60 * 1000; // 10 minutes default
    this.onProgress = options.onProgress;
  }

  public async start(): Promise<Task> {
    const startTime = Date.now();
    let previousStatus: string | null = null;

    while (Date.now() - startTime < this.timeout) {
      const task = await this.tasksResource.retrieve(this.taskId);

      // Fire onProgress callback if provided, especially if status changed
      if (this.onProgress && task.status !== previousStatus) {
        this.onProgress(task);
        previousStatus = task.status;
      } else if (this.onProgress) {
        // Option to fire on every poll tick, but status change is typically better.
        // Firing on status change makes more sense, but user might want heartbeat.
        // We'll fire it here too just in case they want a heartbeat on the task object itself.
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
}
