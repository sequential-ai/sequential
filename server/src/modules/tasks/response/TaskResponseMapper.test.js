const { mapTaskDetailResponse, mapTaskSummaryResponse, normalizeLegacyOutput } = require("./TaskResponseMapper");

describe("TaskResponseMapper", () => {
  describe("normalizeLegacyOutput", () => {
    it("should use new canonical output if available", () => {
      const task = {
        output: {
          format: "markdown",
          content: "# Hello"
        }
      };
      expect(normalizeLegacyOutput(task)).toEqual({
        format: "markdown",
        content: "# Hello"
      });
    });

    it("should handle legacy markdown fallback", () => {
      const task = {
        input: { responseFormat: "markdown" },
        resultAnswer: "Some markdown"
      };
      expect(normalizeLegacyOutput(task)).toEqual({
        format: "markdown",
        content: "Some markdown"
      });
    });

    it("should handle legacy JSON fallback", () => {
      const task = {
        input: { responseFormat: "json" },
        resultAnswer: '{"hello": "world"}'
      };
      expect(normalizeLegacyOutput(task)).toEqual({
        format: "json",
        content: { hello: "world" }
      });
    });
  });

  describe("mapTaskSummaryResponse", () => {
    it("should map to summary representation", () => {
      const task = {
        id: "task_1",
        status: "COMPLETED",
        mode: "FAST",
        query: "Research X",
        createdAt: new Date("2025-01-01"),
        completedAt: new Date("2025-01-02"),
        updatedAt: new Date("2025-01-02")
      };

      const result = mapTaskSummaryResponse(task);
      expect(result.id).toBe("task_1");
      expect(result.status).toBe("completed");
      expect(result.mode).toBe("fast");
      expect(result.output).toBeUndefined();
      expect(result.sources).toBeUndefined();
    });
  });

  describe("mapTaskDetailResponse", () => {
    it("should map canonical markdown output correctly", () => {
      const task = {
        id: "task_1",
        status: "COMPLETED",
        mode: "FAST",
        output: {
          format: "markdown",
          content: "# Result"
        }
      };

      const result = mapTaskDetailResponse(task);
      expect(result.output.type).toBe("markdown");
      expect(result.output.content).toBe("# Result");
    });

    it("should map canonical json output correctly", () => {
      const task = {
        id: "task_1",
        status: "COMPLETED",
        mode: "FAST",
        output: {
          format: "json",
          content: { data: [1, 2, 3] }
        }
      };

      const result = mapTaskDetailResponse(task);
      expect(result.output.type).toBe("json");
      expect(result.output.content).toEqual({ data: [1, 2, 3] });
    });

    it("should handle task failure and CanonicalTaskError", () => {
      const task = {
        id: "task_1",
        status: "FAILED",
        mode: "FAST",
        errorMessage: "Failed validation",
        errorDetails: {
          code: "SYNTHESIS_SCHEMA_MISMATCH",
          retryable: false
        }
      };

      const result = mapTaskDetailResponse(task);
      expect(result.status).toBe("failed");
      expect(result.error).toEqual({
        code: "SYNTHESIS_SCHEMA_MISMATCH",
        message: "Failed validation",
        retryable: false
      });
    });

    it("should include trace if requested", () => {
      const task = {
        id: "task_1",
        status: "COMPLETED",
        mode: "FAST",
        execution: {
          workerRuns: [
            { id: "run_1", workerType: "SEARCH", status: "COMPLETED", durationMs: 100, tokensUsed: 10 }
          ]
        },
        output: {
          format: "markdown",
          content: "test"
        }
      };

      const resultNoTrace = mapTaskDetailResponse(task, { includeTrace: false });
      expect(resultNoTrace.trace).toBeUndefined();

      const resultWithTrace = mapTaskDetailResponse(task, { includeTrace: true });
      expect(resultWithTrace.trace.workers).toHaveLength(1);
      expect(resultWithTrace.trace.workers[0].type).toBe("search");
    });
  });
});
