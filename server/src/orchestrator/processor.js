const { Worker } = require("bullmq");
const { connection, enqueueSearchJob, enqueueScrapeJob, enqueueExtractJob, enqueueSynthesizeJob, researchQueue } = require("./queue");
const prisma = require("../db/db-connection");
const { SubQueryWorker, SearchWorker, ScraperWorker, FactExtractorWorker, SynthesisWorker } = require("../workers");
const embeddingService = require("../services/embedding.service");
const semanticSearchService = require("../services/semantic-search.service");
const SourceManager = require("../modules/tasks/sourceManager");
const EvidenceBuilder = require("../modules/tasks/evidenceBuilder");
const MetricsAggregator = require("../modules/tasks/metricsAggregator");

// Helper to update worker run
async function createWorkerRun(taskId, workerType, provider, model, inputData) {
  return await prisma.workerRun.create({
    data: {
      taskId,
      workerType,
      provider,
      model,
      status: "RUNNING",
      input: inputData,
    },
  });
}

async function completeWorkerRun(runId, outputData, cost = 0, tokensUsed = 0) {
  await prisma.workerRun.update({
    where: { id: runId },
    data: {
      status: "COMPLETED",
      output: outputData,
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
    const { taskId, organizationId, query, mode = "STANDARD", taskSpec = null } = job.data;
    
    // Update task status if it's PLAN
    if (job.name === "PLAN") {
      console.log(`[Task ${taskId}] Starting PLAN job (Mode: ${mode}) for query: "${query}"...`);
      await prisma.task.update({ where: { id: taskId }, data: { status: "PLANNING" } });
      
      const run = await createWorkerRun(taskId, "PLANNER", "openrouter", "gpt-4o-mini", { query, taskSpec });
      try {
        let limit = 3; // STANDARD
        if (mode === "FAST") limit = 1;
        if (mode === "DEEP") limit = 5;
        
        const planner = new SubQueryWorker({ maxSubQueries: limit });
        const result = await planner.run({ query, taskSpec });
        
        await completeWorkerRun(run.id, result, 0, result.usage?.total_tokens || 0);
        
        const subqueries = result.subQueries || result.queries || [query];
        const selectedQueries = subqueries.slice(0, limit);
        console.log(`[Task ${taskId}] PLAN complete. Generated ${selectedQueries.length} subqueries.`);
        for (const sq of selectedQueries) {
          await enqueueSearchJob(taskId, organizationId, sq.query || sq, mode, taskSpec);
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
        
        let limit = 4; // STANDARD
        if (mode === "FAST") limit = 3;
        if (mode === "DEEP") limit = 7;

        const links = (result.organic || []).slice(0, limit).map(r => r.link);
        console.log(`[Task ${taskId}] SEARCH complete. Found ${links.length} links to scrape.`);
        for (const link of links) {
          await enqueueScrapeJob(taskId, organizationId, link, query, mode, taskSpec);
        }
      } catch (err) {
        await failWorkerRun(run.id, err);
        throw err;
      }
    }

    else if (job.name === "SCRAPE") {
      const { url } = job.data;
      console.log(`[Task ${taskId}] Starting SCRAPE job for URL: ${url}...`);
      const run = await createWorkerRun(taskId, "SCRAPE", "jina", "reader", { url });
      try {
        const scraper = new ScraperWorker();
        const result = await scraper.run({ url });
        
        await completeWorkerRun(run.id, { title: result.title }); // don't store full content in outputData
        
        if (result.content && result.content.trim().length > 100) {
          console.log(`[Task ${taskId}] SCRAPE complete. Extracted content, enqueuing EXTRACT phase...`);
          await enqueueExtractJob(taskId, organizationId, url, result.content, query, mode, taskSpec);
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
        const result = await extractor.run({ url, content, query, taskSpec });
        
        let evidence = [];
        let extractedSources = [];
        
        if (result.facts && result.facts.length > 0) {
          const rawSources = [...new Set(result.facts.map(f => f.sourceUrl || url))];
          extractedSources = SourceManager.processSources(rawSources);
          evidence = EvidenceBuilder.buildEvidence(result.facts, extractedSources);
        }

        await completeWorkerRun(run.id, { factsCount: result.facts?.length, evidence, sources: extractedSources }, 0, result.usage?.total_tokens || 0);

        // INLINE EMBEDDING
        if (result.facts && result.facts.length > 0) {
          console.log(`[Task ${taskId}] EXTRACT complete. Found ${result.facts.length} facts. Generating and storing embeddings...`);
          const factStrings = result.facts.map(f => `Claim: ${f.claim}\nEvidence: ${f.evidence}\nConfidence: ${f.confidence}\nSource: ${f.sourceUrl || url}`);
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
      const run = await createWorkerRun(taskId, "SYNTHESIZE", "openrouter", "gpt-4o-mini", { query, taskSpec });
      
      try {
        // Semantic search to get memories
        const topMemories = await semanticSearchService.searchMemories(query, taskId, organizationId, 20);
        
        const rawSources = [...new Set(topMemories.map(m => m.sourceUrl))];
        const processedSources = SourceManager.processSources(rawSources);

        const synthesizer = new SynthesisWorker();
        const result = await synthesizer.run({
          query,
          taskSpec,
          facts: topMemories.map(m => m.content),
          sources: processedSources.map(s => `[${s.id}] ${s.url}`)
        });

        await completeWorkerRun(run.id, result, 0, result.usage?.total_tokens || 0);

        // Fetch all worker runs to compute metrics
        const allRuns = await prisma.workerRun.findMany({ where: { taskId } });
        const metrics = MetricsAggregator.aggregate(allRuns);

        // Update task output with the result
        const taskOutput = {};
        if (result.data) {
          taskOutput.data = result.data;
        } else {
          taskOutput.answer = result.answer || result.content;
        }

        const taskExecution = {
          metrics,
          workerRuns: allRuns.map(r => ({ id: r.id, type: r.workerType, status: r.status, duration: r.durationMs }))
        };

        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: "COMPLETED",
            resultAnswer: result.answer || result.content,
            output: taskOutput,
            execution: taskExecution,
            sources: processedSources,
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

async function checkAndTriggerSynthesize(job) {
  if (["PLAN", "SEARCH", "SCRAPE", "EXTRACT"].includes(job.name)) {
    // Wait a bit to ensure any new jobs are enqueued
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const activeJobs = await researchQueue.getActive();
    const waitingJobs = await researchQueue.getWaiting();
    const delayedJobs = await researchQueue.getDelayed();
    
    const hasMoreJobs = [...activeJobs, ...waitingJobs, ...delayedJobs].some(
      j => j.data?.taskId === job.data.taskId && j.name !== "SYNTHESIZE" && j.id !== job.id
    );
    
    if (!hasMoreJobs) {
      const { taskId, organizationId, taskSpec } = job.data;
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (task && task.status !== "COMPLETED" && task.status !== "FAILED" && task.status !== "SYNTHESIZING") {
        const isSynthesizeEnqueued = [...activeJobs, ...waitingJobs, ...delayedJobs].some(
          j => j.data?.taskId === taskId && j.name === "SYNTHESIZE"
        );
        
        if (!isSynthesizeEnqueued) {
          await enqueueSynthesizeJob(taskId, organizationId, task.query, taskSpec);
        }
      }
    }
  }
}

worker.on("completed", checkAndTriggerSynthesize);
worker.on("failed", checkAndTriggerSynthesize);

module.exports = worker;
