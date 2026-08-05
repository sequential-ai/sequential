const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const researchQueue = new Queue("researchQueue", { connection });

const crypto = require("crypto");

/**
 * Enqueues the initial PLAN job.
 */
async function enqueuePlanJob(taskId, organizationId, query, mode = "STANDARD", taskSpec = null, responseFormat = "markdown") {
  await researchQueue.add(
    "PLAN",
    { taskId, organizationId, query, mode, taskSpec, responseFormat },
    { jobId: `plan-${taskId}` }
  );
}

/**
 * Enqueues a SEARCH job for a specific subquery.
 */
async function enqueueSearchJob(taskId, organizationId, mainQuery, subQuery, purpose, mode, taskSpec = null) {
  const hash = crypto.createHash("md5").update(subQuery).digest("hex");
  const jobId = `search-${taskId}-${hash}`;
  await researchQueue.add(
    "SEARCH",
    { taskId, organizationId, query: mainQuery, subQuery, purpose, mode, taskSpec },
    { jobId }
  );
}

/**
 * Enqueues a SCRAPE job for a specific URL.
 */
async function enqueueScrapeJob(taskId, organizationId, url, mainQuery, subQuery, purpose, mode, taskSpec = null) {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  const jobId = `scrape-${taskId}-${hash}`;
  await researchQueue.add(
    "SCRAPE",
    { taskId, organizationId, url, query: mainQuery, subQuery, purpose, mode, taskSpec },
    { jobId }
  );
}

/**
 * Enqueues an EXTRACT job for scraped content.
 */
async function enqueueExtractJob(taskId, organizationId, url, content, mainQuery, subQuery, purpose, mode, taskSpec = null) {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  const jobId = `extract-${taskId}-${hash}`;
  await researchQueue.add(
    "EXTRACT",
    { taskId, organizationId, url, content, query: mainQuery, subQuery, purpose, mode, taskSpec },
    { jobId }
  );
}

/**
 * Enqueues the final SYNTHESIZE job.
 */
async function enqueueSynthesizeJob(taskId, organizationId, query, taskSpec = null, responseFormat = "markdown") {
  await researchQueue.add(
    "SYNTHESIZE",
    { taskId, organizationId, query, taskSpec, responseFormat },
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
