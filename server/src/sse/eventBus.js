const IORedis = require("ioredis");


const publisher = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");
const subscriber = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

class EventBus {
  constructor() {
    this.subscriber = subscriber;
    this.publisher = publisher;
    this.subscriptions = new Map();

    this.subscriber.on("message", (channel, message) => {
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        try {
          const parsedMessage = JSON.parse(message);
          callbacks.forEach((cb) => cb(parsedMessage));
        } catch (error) {
          console.error(`Failed to parse message on channel ${channel}:`, error);
        }
      }
    });
  }

  /**
   * Publishes an event for a task to Redis.
   * Note: Persistence and sequence generation is now handled by ExecutionTimeline.
   */
  async publish(taskId, eventData) {
    try {
      const channel = `task-events:${taskId}`;
      await this.publisher.publish(channel, JSON.stringify(eventData));
      return eventData;
    } catch (error) {
      console.error(`Error publishing event for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Subscribes to events for a specific task.
   */
  async subscribe(taskId, callback) {
    const channel = `task-events:${taskId}`;

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }

    this.subscriptions.get(channel).add(callback);

    // Return an unsubscribe function
    return async () => {
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel);
          await this.subscriber.unsubscribe(channel);
        }
      }
    };
  }
}

const eventBus = new EventBus();
module.exports = eventBus;