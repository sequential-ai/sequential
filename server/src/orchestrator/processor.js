const { Worker } = require("bullmq");
const { connection, enqueueSearchJob, enqueueScrapeJob, enqueueExtractJob, enqueueSynthesizeJob, researchQueue } = require("./queue");
const prisma = require("../db/db-connection");
const { SubQueryWorker, SearchWorker, ScraperWorker, FactExtractorWorker, SynthesisWorker } = require("../workers");
const embeddingService = require("../services/embedding.service");
const semanticSearchService = require("../services/semantic-search.service");

// Helper to update worker run
async function createWorkerRun(taskId, workerType, provider, model, inputData) {
  return await prisma.workerRun.create({
    data: {
      taskId,
      workerType,
      provider,
      model,
      status: "RUNNING",
      inputData,
    },
  });
}

async function completeWorkerRun(runId, outputData, cost = 0, tokensUsed = 0) {
  await prisma.workerRun.update({
    where: { id: runId },
    data: {
      status: "COMPLETED",
      outputData,
      cost,
      tokensUsed,
      completedAt: new Date(),
    },
  });
}

async function failWorkerRun(runId, error) {
  await prisma.workerRun.update({
    where: { id: runId },
    data: {
      status: "FAILED",
      errorMessage: error.message,
      errorDetails: error.stack ? { stack: error.stack } : {},
      completedAt: new Date(),
    },
  });
}

const worker = new Worker(
  "researchQueue",
  async (job) => {
    const { taskId, organizationId, query, mode = "STANDARD" } = job.data;
    
    // Update task status if it's PLAN
    if (job.name === "PLAN") {
      console.log(`[Task ${taskId}] Starting PLAN job (Mode: ${mode}) for query: "${query}"...`);
      await prisma.task.update({ where: { id: taskId }, data: { status: "PLANNING" } });
      
      const run = await createWorkerRun(taskId, "PLANNER", "openrouter", "gpt-4o-mini", { query });
      try {
        const planner = new SubQueryWorker();
        const result = await planner.run({ query });
        
        await completeWorkerRun(run.id, result, 0, result.usage?.total_tokens || 0);
        
        const subqueries = result.queries || [query];
        
        let limit = 3; // STANDARD
        if (mode === "FAST") limit = 1;
        if (mode === "DEEP") limit = 5;
        
        const selectedQueries = subqueries.slice(0, limit);
        console.log(`[Task ${taskId}] PLAN complete. Generated ${selectedQueries.length} subqueries.`);
        for (const sq of selectedQueries) {
          await enqueueSearchJob(taskId, organizationId, sq.query || sq, mode);
        }
      } catch (err) {
        await failWorkerRun(run.id, err);
        throw err;
      }
    } 
    
    else if (job.name === "SEARCH") {
      console.log(`[Task ${taskId}] Starting SEARCH job for query: "${query}"...`);
      await prisma.task.update({ where: { id: taskId }, data: { status: "RUNNING" } });
      const run = await createWorkerRun(taskId, "SEARCH", "serper", "default", { query });
      try {
        const searcher = new SearchWorker();
        const result = await searcher.run({ query });
        
        await completeWorkerRun(run.id, result);
        
        let limit = 3; // STANDARD
        if (mode === "FAST") limit = 2;
        if (mode === "DEEP") limit = 5;

        const links = (result.organic || []).slice(0, limit).map(r => r.link);
        console.log(`[Task ${taskId}] SEARCH complete. Found ${links.length} links to scrape.`);
        for (const link of links) {
          await enqueueScrapeJob(taskId, organizationId, link, mode);
        }
      } catch (err) {
        await failWorkerRun(run.id, err);
        throw err;
      }
    }

    else if (job.name === "SCRAPE") {
      const { url } = job.data;
      console.log(`[Task ${taskId}] Starting SCRAPE job for URL: ${url}...`);
      const run = await createWorkerRun(taskId, "EXTRACT", "jina", "reader", { url });
      try {
        const scraper = new ScraperWorker();
        const result = await scraper.run({ url });
        
        await completeWorkerRun(run.id, { title: result.title }); // don't store full content in outputData
        
        if (result.content && result.content.trim().length > 100) {
          console.log(`[Task ${taskId}] SCRAPE complete. Extracted content, enqueuing EXTRACT phase...`);
          await enqueueExtractJob(taskId, organizationId, url, result.content, mode);
        }
      } catch (err) {
        await failWorkerRun(run.id, err);
        throw err; // Retry scraper on failure
      }
    }

    else if (job.name === "EXTRACT") {
      const { url, content } = job.data;
      console.log(`[Task ${taskId}] Starting EXTRACT job for URL: ${url}...`);
      const run = await createWorkerRun(taskId, "EXTRACT", "openrouter", "gpt-4o-mini", { url });
      try {
        const extractor = new FactExtractorWorker();
        const result = await extractor.run({ url, content });
        
        await completeWorkerRun(run.id, { factsCount: result.facts?.length }, 0, result.usage?.total_tokens || 0);

        // INLINE EMBEDDING
        if (result.facts && result.facts.length > 0) {
          console.log(`[Task ${taskId}] EXTRACT complete. Found ${result.facts.length} facts. Generating and storing embeddings...`);
          const factStrings = result.facts.map(f => `Claim: ${f.claim}\nEvidence: ${f.evidence}`);
          const embeddings = await embeddingService.generateEmbeddings(factStrings);

          // Save to Memory
          for (let i = 0; i < result.facts.length; i++) {
            const fact = result.facts[i];
            const vectorString = `[${embeddings[i].join(",")}]`;
            
            // Raw SQL insert for pgvector
            await prisma.$executeRaw`
              INSERT INTO "Memory" ("id", "organizationId", "taskId", "sourceUrl", "content", "embedding", "createdAt")
              VALUES (gen_random_uuid()::text, ${organizationId}, ${taskId}, ${fact.sourceUrl || url}, ${factStrings[i]}, ${vectorString}::vector, NOW())
            `;
          }
        }
      } catch (err) {
        await failWorkerRun(run.id, err);
        throw err;
      }
    }

    else if (job.name === "SYNTHESIZE") {
      console.log(`[Task ${taskId}] Starting SYNTHESIZE job...`);
      await prisma.task.update({ where: { id: taskId }, data: { status: "SYNTHESIZING" } });
      const run = await createWorkerRun(taskId, "SYNTHESIZE", "openrouter", "gpt-4o-mini", { query });
      
      try {
        // Semantic search to get memories
        const topMemories = await semanticSearchService.searchMemories(query, taskId, organizationId, 20);
        
        const synthesizer = new SynthesisWorker();
        const result = await synthesizer.run({
          query,
          facts: topMemories.map(m => m.content),
          sources: [...new Set(topMemories.map(m => m.sourceUrl))]
        });

        await completeWorkerRun(run.id, result, 0, result.usage?.total_tokens || 0);

        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: "COMPLETED",
            resultAnswer: result.answer || result.content,
            completedAt: new Date()
          }
        });
        console.log(`[Task ${taskId}] SYNTHESIZE complete! Task finished successfully.`);

      } catch (err) {
        await failWorkerRun(run.id, err);
        await prisma.task.update({ where: { id: taskId }, data: { status: "FAILED" } });
        throw err;
      }
    }
  },
  { connection, concurrency: 5 }
);

// We'll use QueueEvents to trigger SYNTHESIZE when jobs are done.
// A simpler hack for now: if a job finishes and there are no more active/waiting jobs for this taskId, trigger SYNTHESIZE.
// Real robust DAGs use BullMQ Flows, but this is a workable heuristic.
worker.on("completed", async (job) => {
  if (job.name === "EXTRACT") {
    // Wait a bit to ensure any new jobs are enqueued
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // This is naive and just checks if the queue is totally empty.
    // For a production app, use BullMQ Flows or a Task status counter.
    const active = await researchQueue.getActiveCount();
    const waiting = await researchQueue.getWaitingCount();
    
    if (active === 0 && waiting === 0) {
      // Find the task
      const { taskId, organizationId } = job.data;
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (task && task.status === "RUNNING") {
        await enqueueSynthesizeJob(taskId, organizationId, task.query);
      }
    }
  }
});

module.exports = worker;
