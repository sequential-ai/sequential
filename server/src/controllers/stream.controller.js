const prisma = require("../db/db-connection");
const eventBus = require("../sse/eventBus");

const streamTaskEvents = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    
    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Auth check: Is this task part of the org of the user/api key?
    if (task.organizationId !== req.organizationId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Event filtering support
    const eventTypes = (req.query.types || "").split(",").filter(t => t.trim());
    const shouldFilter = eventTypes.length > 0;

    // Send an initial connected ping or first heartbeat immediately
    res.write(`:\n\n`);

    // Handle Last-Event-ID for resume or initial load
    const lastEventId = req.headers["last-event-id"] 
      ? parseInt(req.headers["last-event-id"], 10) 
      : 0;

    let isCompleted = false;

    // Fetch missed events from database (if any)
    const missedEvents = await prisma.taskEvent.findMany({
      where: {
        taskId,
        sequence: { gt: lastEventId }
      },
      orderBy: { sequence: 'asc' }
    });

    for (const ev of missedEvents) {
      // Skip if event type filtering is enabled and this type is not requested
      if (shouldFilter && !eventTypes.includes(ev.type)) {
        continue;
      }

      // Reconstruct the exact v2 Public Event structure
      // (ExecutionTimeline merges correlationId and schemaVersion into the DB payload for storage)
      const { schemaVersion, correlationId, parentEventId, ...actualPayload } = ev.payload || {};

      const data = JSON.stringify({
        schemaVersion: schemaVersion || "2.0",
        sequence: ev.sequence,
        timestamp: ev.createdAt.toISOString(),
        taskId: ev.taskId,
        workerId: ev.workerId,
        correlationId: correlationId || null,
        type: ev.type,
        payload: actualPayload
      });
      res.write(`id: ${ev.sequence}\n`);
      res.write(`event: ${ev.type}\n`);
      res.write(`data: ${data}\n\n`);

      if (['task.completed', 'task.failed', 'task.cancelled'].includes(ev.type)) {
        isCompleted = true;
      }
    }

    if (res.flush) res.flush();

    // If task was already completed in the missed events, close immediately
    if (isCompleted) {
      return res.end();
    }

    let currentSequence = lastEventId;

    // Subscribe to real-time events via Event Bus
    const unsubscribe = await eventBus.subscribe(taskId, (eventData) => {
      // Skip if event type filtering is enabled and this type is not requested
      if (shouldFilter && !eventTypes.includes(eventData.type)) {
        return;
      }

      currentSequence = eventData.sequence;
      res.write(`id: ${eventData.sequence}\n`);
      res.write(`event: ${eventData.type}\n`);
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      if (res.flush) res.flush();
      
      // Close connection if task completed or failed
      if (['task.completed', 'task.failed', 'task.cancelled'].includes(eventData.type)) {
        res.end();
      }
    });

    // Send heartbeat every 15 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      res.write(`event: heartbeat\n`);
      res.write(`data: {"sequence": ${currentSequence}, "taskId": "${taskId}", "timestamp": "${new Date().toISOString()}"}\n\n`);
    }, 15000);

    // Cleanup on client disconnect
    req.on("close", async () => {
      clearInterval(heartbeatInterval);
      if (unsubscribe) {
        await unsubscribe();
      }
    });

  } catch (err) {
    console.error("Error streaming task events:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

module.exports = {
  streamTaskEvents
};
