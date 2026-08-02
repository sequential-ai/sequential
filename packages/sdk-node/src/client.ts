import { HttpClient } from "./http";
import { Tasks } from "./tasks";
import { SequentialAIOptions } from "./types";

export class SequentialAI {
  public apiKey: string;
  public baseURL: string;
  public http: HttpClient;
  public tasks: Tasks;

  /**
   * Initializes a new SequentialAI client.
   * @param options Configuration options for the client.
   */
  constructor(options: SequentialAIOptions = {}) {
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
      maxRetries: options.maxRetries ?? 3,
    });

    this.tasks = new Tasks(this);
  }
}

export default SequentialAI;
