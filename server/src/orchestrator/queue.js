const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const researchQueue = new Queue("researchQueue", { connection });

/**
 * Enqueues the initial PLAN job.
 */
async function enqueuePlanJob(taskId, organizationId, query, mode = "STANDARD") {
  await researchQueue.add(
    "PLAN",
    { taskId, organizationId, query, mode },
    { jobId: `plan-${taskId}` }
  );
}

/**
 * Enqueues a SEARCH job for a specific subquery.
 */
async function enqueueSearchJob(taskId, organizationId, subquery, mode) {
  // Use a unique ID for each subquery to prevent duplicates
  const jobId = `search-${taskId}-${Buffer.from(subquery).toString('base64').substring(0, 10)}`;
  await researchQueue.add(
    "SEARCH",
    { taskId, organizationId, query: subquery, mode },
    { jobId }
  );
}

/**
 * Enqueues a SCRAPE job for a specific URL.
 */
async function enqueueScrapeJob(taskId, organizationId, url, mode) {
  const jobId = `scrape-${taskId}-${Buffer.from(url).toString('base64').substring(0, 10)}`;
  await researchQueue.add(
    "SCRAPE",
    { taskId, organizationId, url, mode },
    { jobId }
  );
}

/**
 * Enqueues an EXTRACT job for scraped content.
 */
async function enqueueExtractJob(taskId, organizationId, url, content, mode) {
  const jobId = `extract-${taskId}-${Buffer.from(url).toString('base64').substring(0, 10)}`;
  await researchQueue.add(
    "EXTRACT",
    { taskId, organizationId, url, content, mode },
    { jobId }
  );
}

/**
 * Enqueues the final SYNTHESIZE job.
 */
async function enqueueSynthesizeJob(taskId, organizationId, query) {
  await researchQueue.add(
    "SYNTHESIZE",
    { taskId, organizationId, query },
    { jobId: `synthesize-${taskId}` }
  );
}

module.exports = {
  connection,
  researchQueue,
  enqueuePlanJob,
  enqueueSearchJob,
  enqueueScrapeJob,
  enqueueExtractJob,
  enqueueSynthesizeJob,
};
