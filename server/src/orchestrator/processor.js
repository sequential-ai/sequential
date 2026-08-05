const { Worker } = require("bullmq");
const { connection, enqueueSearchJob, enqueueScrapeJob, enqueueExtractJob, enqueueSynthesizeJob, researchQueue } = require("./queue");
const prisma = require("../db/db-connection");
const EventMapper = require("../sse/EventMapper");
const EventPipeline = require("../sse/EventPipeline");
const TaskExecutionContext = require("../modules/tasks/TaskExecutionContext");
const { SubQueryWorker, SearchWorker, ScraperWorker, FactExtractorWorker, SynthesisWorker } = require("../workers");
const embeddingService = require("../services/embedding.service");
const semanticSearchService = require("../services/semantic-search.service");
const SourceManager = require("../modules/tasks/sourceManager");
const EvidenceBuilder = require("../modules/tasks/evidenceBuilder");

const activeContexts = new Map();

function getOrCreateContext(taskId) {
  if (!activeContexts.has(taskId)) {
    activeContexts.set(taskId, new TaskExecutionContext(taskId));
  }
  return activeContexts.get(taskId);
}

function destroyContext(taskId) {
  activeContexts.delete(taskId);
}

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

async function completeWorkerRun(runId, outputData, cost = 0, usage = null) {
  const run = await prisma.workerRun.findUnique({ where: { id: runId } });
  const completedAt = new Date();
  const durationMs = run && run.startedAt ? completedAt.getTime() - run.startedAt.getTime() : null;

  await prisma.workerRun.update({
    where: { id: runId },
    data: {
      status: "COMPLETED",
      output: outputData,
      cost,
      usage,
      tokensUsed: usage && usage.total ? usage.total : 0,
      completedAt,
      durationMs,
    },
  });
}

async function failWorkerRun(runId, error) {
  const run = await prisma.workerRun.findUnique({ where: { id: runId } });
  const completedAt = new Date();
  const durationMs = run && run.startedAt ? completedAt.getTime() - run.startedAt.getTime() : null;

  await prisma.workerRun.update({
    where: { id: runId },
    data: {
      status: "FAILED",
      errorMessage: error.message,
      errorDetails: error.stack ? { stack: error.stack } : {},
      completedAt,
      durationMs,
    },
  });
}

const worker = new Worker(
  "researchQueue",
  async (job) => {
    const { taskId, organizationId, query: mainQuery, subQuery, purpose, mode = "STANDARD", taskSpec = null, responseFormat = "markdown" } = job.data;
    
    const taskContext = getOrCreateContext(taskId);
    
    // Update task status if it's PLAN
    if (job.name === "PLAN") {
      console.log(`[Task ${taskId}] Starting PLAN job (Mode: ${mode}) for query: "${mainQuery}"...`);
      await prisma.task.update({ where: { id: taskId }, data: { status: "PLANNING", startedAt: new Date() } });
      EventMapper.mapTaskStarted(taskId, mode, mainQuery);
      
      const run = await createWorkerRun(taskId, "PLANNER", "openrouter", "gpt-4o-mini", { query: mainQuery, taskSpec });
      try {
        let limit = 3; // STANDARD
        if (mode === "FAST") limit = 1;
        if (mode === "DEEP") limit = 5;
        
        const planner = new SubQueryWorker({ maxSubQueries: limit });
        // planner extends BaseWorker which takes (taskId, input, taskContext)
        const result = await planner.execute(taskId, { query: mainQuery, taskSpec }, taskContext);
        
        const tokens = result.usage?.total || 0;
        const cost = result.usage?.cost || 0;
        taskContext.recordWorkerUsage('planner', result.usage, cost);
        await completeWorkerRun(run.id, result, cost, result.usage);
        EventMapper.mapMetricsUpdated(taskId, 'planner', taskContext);
        EventMapper.mapWorkerCompleted(taskId, 'planner', { status: 'success' });
        
        const subqueries = result.subQueries || result.queries || [mainQuery];
        const selectedQueries = subqueries.slice(0, limit);
        console.log(`[Task ${taskId}] PLAN complete. Generated ${selectedQueries.length} subqueries.`);
        for (const sq of selectedQueries) {
          const sqText = sq.query || sq;
          const sqPurpose = sq.purpose || "";
          await enqueueSearchJob(taskId, organizationId, mainQuery, sqText, sqPurpose, mode, taskSpec);
        }
      } catch (err) {
        await failWorkerRun(run.id, err);
        EventMapper.mapWorkerFailed(taskId, 'planner', { error: err.message });
        throw err;
      }
    } 
    
    else if (job.name === "SEARCH") {
      const activeQuery = subQuery || mainQuery;
      console.log(`[Task ${taskId}] Starting SEARCH job for query: "${activeQuery}"...`);
      await prisma.task.update({ where: { id: taskId }, data: { status: "RUNNING" } });
      const run = await createWorkerRun(taskId, "SEARCH", "serper", "default", { query: activeQuery });
      try {
        const searcher = new SearchWorker();
        const domainResults = await searcher.execute(taskId, { query: activeQuery }, taskContext);
        
        // Pass Domain Models to Event Mapper
        EventMapper.mapSearchResults(taskId, 'search', domainResults);
        
        taskContext.recordWorkerUsage('search', null, 0.001); // Approx serper cost
        await completeWorkerRun(run.id, domainResults, 0.001, null);
        EventMapper.mapMetricsUpdated(taskId, 'search', taskContext);
        EventMapper.mapWorkerCompleted(taskId, 'search', { status: 'success' });
        
        let limit = 4; // STANDARD
        if (mode === "FAST") limit = 3;
        if (mode === "DEEP") limit = 7;

        // Scraper handles source extraction
        const links = domainResults.slice(0, limit).map(r => r.url);
        console.log(`[Task ${taskId}] SEARCH complete. Found ${links.length} links to scrape.`);
        for (const link of links) {
          EventMapper.mapSourceLifecycle(taskId, 'search', link, 'discovered');
          await enqueueScrapeJob(taskId, organizationId, link, mainQuery, subQuery, purpose, mode, taskSpec);
        }
      } catch (err) {
        await failWorkerRun(run.id, err);
        EventMapper.mapWorkerFailed(taskId, 'search', { error: err.message });
        throw err;
      }
    }

    else if (job.name === "SCRAPE") {
      const { url } = job.data;
      console.log(`[Task ${taskId}] Starting SCRAPE job for URL: ${url}...`);
      EventMapper.mapSourceLifecycle(taskId, 'SCRAPE', url, 'fetching');
      
      const run = await createWorkerRun(taskId, "SCRAPE", "jina", "reader", { url });
      try {
        const scraper = new ScraperWorker();
        const result = await scraper.execute(taskId, { url }, taskContext);
        
        taskContext.recordSource('fetched');
        taskContext.recordWorkerUsage(`scrape_${run.id}`, null, 0.0005);
        await completeWorkerRun(run.id, { title: result.title }, 0.0005, null); // don't store full content in outputData
        
        EventMapper.mapSourceLifecycle(taskId, 'scraper', url, 'fetched');
        EventMapper.mapMetricsUpdated(taskId, 'scraper', taskContext);
        EventMapper.mapWorkerCompleted(taskId, 'scraper', { status: 'success' });
        
        if (result.content && result.content.trim().length > 100) {
          console.log(`[Task ${taskId}] SCRAPE complete. Extracted content, enqueuing EXTRACT phase...`);
          await enqueueExtractJob(taskId, organizationId, url, result.content, mainQuery, subQuery, purpose, mode, taskSpec);
        }
      } catch (err) {
        taskContext.recordSource('failed');
        EventMapper.mapSourceLifecycle(taskId, 'scraper', url, 'failed');
        EventMapper.mapMetricsUpdated(taskId, 'scraper', taskContext);
        EventMapper.mapWorkerFailed(taskId, 'scraper', { error: err.message });
        
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
        // Since FactExtractor isn't refactored yet, we just call run manually or execute if refactored
        // Let's assume we will refactor FactExtractorWorker to extend BaseWorker next.
        const result = await extractor.execute(taskId, { url, content, query: mainQuery, subQuery, purpose, taskSpec }, taskContext);
        
        let evidence = [];
        let extractedSources = [];
        
        if (result.facts && result.facts.length > 0) {
          taskContext.recordFact(result.facts.length);
          const rawSources = [...new Set(result.facts.map(f => f.sourceUrl || url))];
          extractedSources = SourceManager.processSources(rawSources);
          
          const enrichedFacts = result.facts.map(fact => {
            const matchedSource = extractedSources.find(s => s.url === (fact.sourceUrl || url));
            return {
              factId: fact.id,
              claim: fact.claim,
              evidence: fact.evidence,
              confidence: fact.confidence,
              sourceId: matchedSource ? matchedSource.id : null,
              worker: 'extract',
              timestamp: new Date().toISOString()
            };
          });
          
          evidence = EvidenceBuilder.buildEvidence(result.facts, extractedSources);
          
          EventMapper.mapFactsExtracted(taskId, 'extract', enrichedFacts);
          EventPipeline.flushFacts(taskId, 'extract'); // Force flush any remaining batched facts
        }

        const cost = result.usage?.cost || 0;
        taskContext.recordWorkerUsage(`extract_${run.id}`, result.usage, cost);
        await completeWorkerRun(run.id, { factsCount: result.facts?.length, evidence, sources: extractedSources }, cost, result.usage);
        EventMapper.mapMetricsUpdated(taskId, 'extract', taskContext);
        EventMapper.mapWorkerCompleted(taskId, 'extract', { status: 'success' });

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
        EventMapper.mapWorkerFailed(taskId, 'extract', { error: err.message });
        throw err;
      }
    }

    else if (job.name === "SYNTHESIZE") {
      console.log(`[Task ${taskId}] Starting SYNTHESIZE job...`);
      await prisma.task.update({ where: { id: taskId }, data: { status: "SYNTHESIZING" } });
      const run = await createWorkerRun(taskId, "SYNTHESIZE", "openrouter", "gpt-4o-mini", { query: mainQuery, taskSpec });
      
      try {
        // Semantic search to get memories
        const topMemories = await semanticSearchService.searchMemories(mainQuery, taskId, organizationId, 20);
        
        const rawSources = [...new Set(topMemories.map(m => m.sourceUrl))];
        const processedSources = SourceManager.processSources(rawSources);

        const synthesizer = new SynthesisWorker();
        const result = await synthesizer.execute(taskId, {
          query: mainQuery,
          taskSpec,
          responseFormat,
          facts: topMemories.map(m => m.content),
          sources: processedSources.map(s => `[${s.id}] ${s.url}`)
        }, taskContext);

        const cost = result.usage?.cost || 0;
        taskContext.recordWorkerUsage('synthesis', result.usage, cost);
        await completeWorkerRun(run.id, result, cost, result.usage);
        EventMapper.mapMetricsUpdated(taskId, 'synthesis', taskContext);
        EventMapper.mapWorkerCompleted(taskId, 'synthesis', { status: 'success' });

        // Fetch all worker runs to compute metrics
        const allRuns = await prisma.workerRun.findMany({ where: { taskId } });
        const MetricsAggregator = require("../modules/tasks/metricsAggregator");
        const aggregatedMetrics = MetricsAggregator.aggregate(allRuns);

        // Update task output with the result
        const taskOutput = {};
        if (result.data) {
          taskOutput.data = result.data;
        } else {
          taskOutput.answer = result.answer || result.content;
        }

        const taskExecution = {
          metrics: aggregatedMetrics,
          workerRuns: allRuns.map(r => ({ id: r.id, type: r.workerType, status: r.status, duration: r.durationMs }))
        };

        const taskRecord = await prisma.task.findUnique({ where: { id: taskId } });
        const taskCompletedAt = new Date();
        const executionTimeMs = taskRecord && taskRecord.startedAt ? taskCompletedAt.getTime() - taskRecord.startedAt.getTime() : null;

        await prisma.task.update({
          where: { id: taskId },
          data: {
            status: "COMPLETED",
            resultAnswer: result.answer || result.content,
            output: taskOutput,
            execution: taskExecution,
            sources: processedSources,
            completedAt: taskCompletedAt,
            executionTimeMs,
            actualCost: aggregatedMetrics.actualCost,
            billableCost: aggregatedMetrics.billableCost,
            costTotal: aggregatedMetrics.billableCost, // backward compatibility
            tokensUsed: aggregatedMetrics.tokens.total,
            usage: aggregatedMetrics
          }
        });
        EventMapper.mapTaskCompleted(taskId, 'success', executionTimeMs || 0);
        destroyContext(taskId);
        console.log(`[Task ${taskId}] SYNTHESIZE complete! Task finished successfully.`);

      } catch (err) {
        await failWorkerRun(run.id, err);
        await prisma.task.update({ where: { id: taskId }, data: { status: "FAILED" } });
        EventMapper.mapWorkerFailed(taskId, 'synthesis', { error: err.message });
        // Emit failed event via mapping or pipeline directly if needed. We don't have mapTaskFailed, so we'll just log.
        destroyContext(taskId);
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
        const responseFormat = task.input?.responseFormat || "markdown";
        const isSynthesizeEnqueued = [...activeJobs, ...waitingJobs, ...delayedJobs].some(
          j => j.data?.taskId === taskId && j.name === "SYNTHESIZE"
        );
        
        if (!isSynthesizeEnqueued) {
          await enqueueSynthesizeJob(taskId, organizationId, task.query, taskSpec, responseFormat);
        }
      }
    }
  }
}

worker.on("completed", checkAndTriggerSynthesize);
worker.on("failed", checkAndTriggerSynthesize);

module.exports = worker;
