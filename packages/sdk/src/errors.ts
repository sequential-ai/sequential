export class SequentialAIError extends Error {
  public status?: number;
  public headers?: Headers;
  public body?: any;

  constructor(message: string, status?: number, body?: any, headers?: Headers) {
    super(message);
    this.name = "SequentialAIError";
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}

export class AuthenticationError extends SequentialAIError {
  constructor(message: string, status?: number, body?: any, headers?: Headers) {
    super(message, status, body, headers);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends SequentialAIError {
  constructor(message: string, status?: number, body?: any, headers?: Headers) {
    super(message, status, body, headers);
    this.name = "RateLimitError";
  }
}

export class TimeoutError extends SequentialAIError {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class TaskFailedError extends SequentialAIError {
  public taskId: string;

  constructor(message: string, taskId: string, body?: any) {
    super(message, undefined, body);
    this.name = "TaskFailedError";
    this.taskId = taskId;
  }
}

export class ValidationError extends SequentialAIError {
  constructor(message: string, status?: number, body?: any, headers?: Headers) {
    super(message, status, body, headers);
    this.name = "ValidationError";
  }
}

export class APIError extends SequentialAIError {
  constructor(message: string, status?: number, body?: any, headers?: Headers) {
    super(message, status, body, headers);
    this.name = "APIError";
  }
}
