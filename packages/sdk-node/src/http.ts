import {
  APIError,
  AuthenticationError,
  RateLimitError,
  SequentialAIError,
  ValidationError,
} from "./errors";
import { calculateExponentialBackoff, sleep } from "./utils";

export interface HttpClientOptions {
  baseURL: string;
  apiKey: string;
  maxRetries: number;
}

export interface ServerSentEvent {
  event: string | null;
  data: string;
  id: string | null;
}

export class HttpClient {
  private baseURL: string;
  private apiKey: string;
  private maxRetries: number;

  constructor(options: HttpClientOptions) {
    this.baseURL = options.baseURL.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.maxRetries = options.maxRetries;
  }

  private async handleError(response: Response): Promise<never> {
    let body: any = null;
    try {
      body = await response.json();
    } catch {
      try {
        body = await response.text();
      } catch {
        // body remains null
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

  public async request<T>(
    method: string,
    path: string,
    options?: { body?: any; headers?: Record<string, string> }
  ): Promise<T> {
    const url = `${this.baseURL}${path.startsWith("/") ? path : `/${path}`}`;
    let attempt = 0;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options?.headers,
    };

    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        if (response.ok) {
          if (response.status === 204) {
            return {} as T;
          }
          return (await response.json()) as T;
        }

        // Retryable status codes
        if ([429, 500, 502, 503, 504].includes(response.status) && attempt < this.maxRetries) {
          attempt++;
          const delay = calculateExponentialBackoff(attempt);
          await sleep(delay);
          continue;
        }

        return this.handleError(response);
      } catch (error: any) {
        // Network errors or fetch errors
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

  public async get<T>(path: string, options?: { headers?: Record<string, string> }): Promise<T> {
    return this.request<T>("GET", path, options);
  }

  public async *stream(path: string, options?: { headers?: Record<string, string> }): AsyncIterableIterator<ServerSentEvent> {
    const url = `${this.baseURL}${path.startsWith("/") ? path : `/${path}`}`;
    let attempt = 0;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "text/event-stream",
      ...options?.headers,
    };

    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch(url, { method: "GET", headers });
        if (!response.ok) {
           if ([429, 500, 502, 503, 504].includes(response.status) && attempt < this.maxRetries) {
              attempt++;
              const delay = calculateExponentialBackoff(attempt);
              await sleep(delay);
              continue;
           }
           await this.handleError(response);
        }

        if (!response.body) {
           throw new SequentialAIError("Response body is empty");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          
          buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

          let event: string | null = null;
          let data = "";
          let id: string | null = null;

          for (const line of lines) {
            if (line.trim() === "") {
              if (data) {
                yield { event, data: data.trim(), id };
              }
              event = null;
              data = "";
              id = null;
            } else if (line.startsWith("event: ")) {
              event = line.slice(7);
            } else if (line.startsWith("data: ")) {
              data += line.slice(6) + "\n";
            } else if (line.startsWith("id: ")) {
              id = line.slice(4);
            } else if (line.startsWith(":")) {
              // Comment, ignore
            }
          }
        }
        
        if (buffer.trim() !== "") {
            // Process any remaining buffer content
            const lines = buffer.split(/\r?\n/);
            let event: string | null = null;
            let data = "";
            let id: string | null = null;
            for (const line of lines) {
              if (line.trim() === "") {
                if (data) yield { event, data: data.trim(), id };
                event = null;
                data = "";
                id = null;
              } else if (line.startsWith("event: ")) {
                event = line.slice(7);
              } else if (line.startsWith("data: ")) {
                data += line.slice(6) + "\n";
              } else if (line.startsWith("id: ")) {
                id = line.slice(4);
              }
            }
            if (data) yield { event, data: data.trim(), id };
        }
        
        return; // Successfully completed stream
      } catch (error: any) {
        if (attempt < this.maxRetries) {
          attempt++;
          const delay = calculateExponentialBackoff(attempt);
          await sleep(delay);
          continue;
        }
        throw new SequentialAIError(`Network error while streaming: ${error.message}`);
      }
    }
    throw new SequentialAIError("Max retries exceeded while trying to stream");
  }

  public async post<T>(path: string, body?: any, options?: { headers?: Record<string, string> }): Promise<T> {
    return this.request<T>("POST", path, { body, ...options });
  }

  public async put<T>(path: string, body?: any, options?: { headers?: Record<string, string> }): Promise<T> {
    return this.request<T>("PUT", path, { body, ...options });
  }

  public async delete<T>(path: string, options?: { headers?: Record<string, string> }): Promise<T> {
    return this.request<T>("DELETE", path, options);
  }
}
