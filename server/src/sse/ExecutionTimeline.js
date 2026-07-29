const prisma = require("../db/db-connection");
const eventBus = require("./eventBus");
const IORedis = require("ioredis");

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

class ExecutionTimeline {
  constructor() {
    this.queues = new Map();
  }

  /**
   * Appends an event to the persistent execution timeline.
   * Ensures strict ordering via Redis INCR, saves to DB, then delegates to transport (EventBus).
   * 
   * @param {Object} event - The base event payload from EventMapper/Pipeline
   */
  async append(event) {
    const { taskId } = event;
    
    if (!this.queues.has(taskId)) {
      this.queues.set(taskId, Promise.resolve());
    }

    const taskQueue = this.queues.get(taskId);
    
    const nextPromise = taskQueue.then(async () => {
      try {
        const { workerId, type, payload, correlationId } = event;

        // 1. Generate strictly increasing unique sequence
        const sequenceKey = `task:${taskId}:seq`;
        const sequence = await redis.incr(sequenceKey);

        // 2. Persist to DB (System of Record)
        const eventRecord = await prisma.taskEvent.create({
          data: {
            taskId,
            sequence,
            type,
            workerId,
            payload: {
              ...payload,
              schemaVersion: "2.0",
              correlationId
            }
          },
        });

        // 3. Construct the exact public Event Contract payload
        const publicEvent = {
          schemaVersion: "2.0",
          sequence: eventRecord.sequence,
          timestamp: eventRecord.createdAt.toISOString(),
          taskId: eventRecord.taskId,
          workerId: eventRecord.workerId,
          correlationId,
          type: eventRecord.type,
          payload: payload // Just the raw payload data
        };

        // 4. Pass to transport layer
        await eventBus.publish(taskId, publicEvent);
        return publicEvent;
      } catch (error) {
        console.error(`ExecutionTimeline append failed for task ${event.taskId}:`, error);
        throw error;
      }
    });

    this.queues.set(taskId, nextPromise.catch(() => {}));
    return nextPromise;
  }
}

const executionTimeline = new ExecutionTimeline();
module.exports = executionTimeline;
