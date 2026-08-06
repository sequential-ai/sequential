const { Worker } = require("bullmq");
const { connection, enqueueSearchJob, enqueueScrapeJob, enqueueExtractJob, enqueueEvaluateJob, enqueueSynthesizeJob, enqueueVerifyJob, researchQueue } = require("./queue");
const prisma = require("../db/db-connection");
const EventMapper = require("../sse/EventMapper");
const EventPipeline = require("../sse/EventPipeline");
const TaskExecutionContext = require("../modules/tasks/TaskExecutionContext");
const { SubQueryWorker, SearchWorker, ScraperWorker, FactExtractorWorker, EvaluateWorker, SynthesisWorker, VerificationWorker } = require("../workers");
const embeddingService = require("../services/embedding.service");
const semanticSearchService = require("../services/semantic-search.service");
const chunkingService = require("../services/chunking.service");
const contextManagementService = require("../services/context-management.service");
const sourceQualityService = require("../services/source-quality.service");
const qualityMetricsService = require("../services/quality-metrics.service");
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

/**
 * Prioritize subqueries based on iteration and mode
 * Reduces token usage by focusing on most critical gaps
 */
function prioritizeSubqueries(subqueries, currentIteration, maxIterations) {
  // In early iterations, allow more subqueries
  // In later iterations, be more selective
  const maxSubqueries = Math.ceil(subqueries.length * (1 - (currentIteration / maxIterations) * 0.5));
  
  // Sort by purpose priority (heuristic)
  const priorityOrder = ['critical', 'missing', 'clarification', 'additional'];
  
  const prioritized = subqueries
    .map(sq => ({
      ...sq,
      priority: priorityOrder.findIndex(p => (sq.purpose || '').toLowerCase().includes(p))
    }))
    .sort((a, b) => {
      // Sort by priority first, then by index
      if (a.priority !== -1 && b.priority !== -1) {
        return a.priority - b.priority;
      }
      if (a.priority !== -1) return -1;
      if (b.priority !== -1) return 1;
      return 0;
    });
  
  return prioritized.slice(0, Math.max(1, maxSubqueries));
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
        
        const planner = new SubQueryWorker({ maxSubQueries: limit, mode });
        // planner extends BaseWorker which takes (taskId, input, taskContext)
        const result = await planner.execute(taskId, { query: mainQuery, taskSpec, mode, maxSubQueries: limit }, taskContext);
        
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
        
        // Apply source quality scoring and ranking
        const rankedSources = sourceQualityService.rankSources(domainResults);
        const qualityReport = sourceQualityService.getQualityReport(domainResults);
        
        console.log(`[Task ${taskId}] Source quality report: ${JSON.stringify(qualityReport.qualityDistribution)}`);
        
        // Select top sources based on mode
        let limit = 8; // STANDARD
        if (mode === "FAST") limit = 5;
        if (mode === "DEEP") limit = 12;
        
        // Apply diversity constraints with stricter limits for better diversity
        const maxPerDomain = mode === "DEEP" ? 3 : mode === "STANDARD" ? 2 : 1;
        const selectedSources = sourceQualityService.selectTopSources(domainResults, limit, maxPerDomain);
        
        // Check if we have sources to scrape
        if (!selectedSources || selectedSources.length === 0) {
          console.log(`[Task ${taskId}] No sources selected for scraping, skipping to SYNTHESIZE`);
          await enqueueSynthesizeJob(taskId, organizationId, mainQuery, taskSpec, responseFormat);
          return;
        }
        
        // Pass Domain Models to Event Mapper
        EventMapper.mapSearchResults(taskId, 'search', selectedSources.map(s => s.source));
        
        taskContext.recordWorkerUsage('search', null, 0.001); // Approx serper cost
        await completeWorkerRun(run.id, { results: selectedSources, qualityReport }, 0.001, null);
        EventMapper.mapMetricsUpdated(taskId, 'search', taskContext);
        EventMapper.mapWorkerCompleted(taskId, 'search', { status: 'success' });
        
        // Record source quality metrics
        qualityMetricsService.recordSourceMetrics(selectedSources.map(s => s.source));
        
        // Scraper handles source extraction
        const links = selectedSources.map(s => s.source.url);
        console.log(`[Task ${taskId}] SEARCH complete. Selected ${links.length} high-quality, diverse links to scrape.`);
        for (const link of links) {
          const normalized = link.trim().toLowerCase();
          const added = await connection.sadd(`task:${taskId}:urls`, normalized);
          
          if (added) {
            await connection.expire(`task:${taskId}:urls`, 86400);
            EventMapper.mapSourceLifecycle(taskId, 'search', link, 'discovered');
            await enqueueScrapeJob(taskId, organizationId, link, mainQuery, subQuery, purpose, mode, taskSpec);
          } else {
            console.log(`[Task ${taskId}] Skipping already processed URL: ${link}`);
          }
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
      
      const TTL_HOURS = parseInt(process.env.WEB_CACHE_TTL_HOURS || "12", 10);
      const cacheCutoff = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000);

      const cachedResult = await prisma.$queryRaw`
        SELECT id FROM "Memory"
        WHERE "organizationId" = ${organizationId}
          AND "sourceUrl" = ${url}
          AND "createdAt" >= ${cacheCutoff}
        LIMIT 1
      `;

      if (cachedResult && cachedResult.length > 0) {
        console.log(`[Task ${taskId}] SCRAPE cache hit for URL: ${url}`);
        EventMapper.mapSourceLifecycle(taskId, 'scraper', url, 'fetched');
        await enqueueExtractJob(taskId, organizationId, url, null, mainQuery, subQuery, purpose, mode, taskSpec);
        return;
      }
      
      const run = await createWorkerRun(taskId, "SCRAPE", "jina", "reader", { url });
      try {
        const scraper = new ScraperWorker();
        const result = await scraper.execute(taskId, { url }, taskContext);
        
        taskContext.recordSource('fetched');
        taskContext.recordWorkerUsage(`scrape_${run.id}`, null, 0.0005);
        await completeWorkerRun(run.id, { title: result.title }, 0.0005, null);
        
        EventMapper.mapSourceLifecycle(taskId, 'scraper', url, 'fetched');
        EventMapper.mapMetricsUpdated(taskId, 'scraper', taskContext);
        EventMapper.mapWorkerCompleted(taskId, 'scraper', { status: 'success' });
        
        if (result.content && result.content.trim().length > 100) {
          console.log(`[Task ${taskId}] SCRAPE complete. Adaptive chunking and embedding content...`);
          
          // Use adaptive chunking service for better efficiency
          const chunks = chunkingService.chunkContent(result.content, {
            respectStructure: true // Enable structure-aware chunking
          });

          if (chunks.length > 0) {
            const { embeddings, usage } = await embeddingService.generateEmbeddingsWithUsage(chunks);
            if (usage) taskContext.recordWorkerUsage(`embed_${Date.now()}`, usage, usage.cost);

            for (let i = 0; i < chunks.length; i++) {
              const vectorString = `[${embeddings[i].join(",")}]`;
              await prisma.$executeRaw`
                INSERT INTO "Memory" ("id", "organizationId", "taskId", "sourceUrl", "content", "embedding", "createdAt")
                VALUES (gen_random_uuid()::text, ${organizationId}, ${taskId}, ${url}, ${chunks[i]}, ${vectorString}::vector, NOW())
              `;
            }
          }
          await enqueueExtractJob(taskId, organizationId, url, null, mainQuery, subQuery, purpose, mode, taskSpec);
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
      const { url } = job.data;
      console.log(`[Task ${taskId}] Starting EXTRACT job for URL: ${url}...`);
      const run = await createWorkerRun(taskId, "EXTRACT", "openrouter", "gpt-4o-mini", { url });
      try {
        const searchQuery = `${subQuery || mainQuery} ${purpose || ""}`.trim();
        const topK = parseInt(process.env.EXTRACTION_TOP_K_CHUNKS || "10", 10);
        const maxTokens = parseInt(process.env.EXTRACTION_MAX_CONTEXT_TOKENS || "8000", 10);
        
        const { embeddings, usage } = await embeddingService.generateEmbeddingsWithUsage([searchQuery]);
        if (usage) taskContext.recordWorkerUsage(`embed_${Date.now()}`, usage, usage.cost);

        const vectorString = `[${embeddings[0].join(",")}]`;

        const chunks = await prisma.$queryRaw`
          SELECT "id", "content", "embedding" <=> ${vectorString}::vector as distance
          FROM "Memory"
          WHERE "organizationId" = ${organizationId}
            AND "sourceUrl" = ${url}
          ORDER BY distance ASC
          LIMIT ${topK}
        `;
        
        // Use context management service for optimal chunk selection
        const chunkContents = chunks.map(c => c.content);
        const chunkEmbeddings = chunks.map(c => c.embedding);
        
        const selectedChunks = contextManagementService.selectRelevantChunks(
          chunkContents, 
          embeddings[0], 
          chunkEmbeddings, 
          maxTokens
        );
        
        let contextContent = selectedChunks.join('\n\n');
        const chunkIds = chunks.slice(0, selectedChunks.length).map(c => c.id);

        const extractor = new FactExtractorWorker({ mode });
        const result = await extractor.execute(taskId, { url, content: contextContent, query: mainQuery, subQuery, purpose, taskSpec, mode }, taskContext);
        
        let evidence = [];
        let extractedSources = [];
        
        if (result.facts && result.facts.length > 0) {
          taskContext.recordFact(result.facts.length);
          const rawSources = [...new Set(result.facts.map(f => f.sourceUrl || url))];
          extractedSources = SourceManager.processSources(rawSources);
          
          const enrichedFacts = [];
          for (const fact of result.facts) {
            const matchedSource = extractedSources.find(s => s.url === (fact.sourceUrl || url));
            const sourceId = matchedSource ? matchedSource.id : null;
            
            // Persist to TaskEvidence
            await prisma.taskEvidence.create({
              data: {
                organizationId,
                taskId,
                subQueryId: job.id, // using job.id as proxy for subQueryId
                sourceId: sourceId || "unknown",
                sourceUrl: fact.sourceUrl || url,
                sourceTitle: result.title || null,
                chunkIds,
                claim: fact.claim,
                evidence: fact.evidence,
                confidence: fact.confidence,
                relevance: fact.relevance,
                entities: fact.entities || [],
                category: fact.category
              }
            });

            enrichedFacts.push({
              factId: fact.id,
              claim: fact.claim,
              evidence: fact.evidence,
              confidence: fact.confidence,
              sourceId,
              worker: 'extract',
              timestamp: new Date().toISOString()
            });
          }
          
          evidence = EvidenceBuilder.buildEvidence(result.facts, extractedSources);
          
          EventMapper.mapFactsExtracted(taskId, 'extract', enrichedFacts);
          EventPipeline.flushFacts(taskId, 'extract');
        }

        const cost = result.usage?.cost || 0;
        taskContext.recordWorkerUsage(`extract_${run.id}`, result.usage, cost);
        await completeWorkerRun(run.id, { factsCount: result.facts?.length, evidence, sources: extractedSources }, cost, result.usage);
        EventMapper.mapMetricsUpdated(taskId, 'extract', taskContext);
        EventMapper.mapWorkerCompleted(taskId, 'extract', { status: 'success' });

      } catch (err) {
        await failWorkerRun(run.id, err);
        EventMapper.mapWorkerFailed(taskId, 'extract', { error: err.message });
        throw err;
      }
    }

    else if (job.name === "EVALUATE") {
      const currentIteration = job.data.iteration || 1;
      const maxIterations = mode === "DEEP" ? 4 : mode === "STANDARD" ? 2 : 1;
      
      console.log(`[Task ${taskId}] Starting EVALUATE job (Iteration: ${currentIteration}/${maxIterations})...`);
      const run = await createWorkerRun(taskId, "EVALUATE", "openrouter", "gpt-4o-mini", { query: mainQuery, iteration: currentIteration });
      try {
        const taskEvidences = await prisma.taskEvidence.findMany({ where: { taskId, organizationId } });
        const EvidenceAggregator = require("../modules/tasks/evidenceAggregator");
        const aggregatedFacts = EvidenceAggregator.aggregate(taskEvidences);

        const evaluator = new EvaluateWorker({ mode });
        const result = await evaluator.execute(taskId, {
          query: mainQuery,
          facts: aggregatedFacts.map(f => `Claim: ${f.claim}\nEvidence: ${f.evidenceText}`),
          mode,
          iteration: currentIteration,
          maxIterations
        }, taskContext);

        const cost = result.usage?.cost || 0;
        taskContext.recordWorkerUsage(`evaluate_${run.id}`, result.usage, cost);
        await completeWorkerRun(run.id, result, cost, result.usage);
        
        const subqueries = result.subQueries || [];
        
        // Adaptive branching logic
        if (subqueries.length > 0 && currentIteration < maxIterations) {
          console.log(`[Task ${taskId}] EVALUATE found gaps. Enqueueing ${subqueries.length} new searches (iteration ${currentIteration + 1}).`);
          await prisma.task.update({ where: { id: taskId }, data: { iteration: currentIteration + 1 } });
          
          // Prioritize and limit subqueries based on iteration
          const prioritizedSubqueries = this.prioritizeSubqueries(subqueries, currentIteration, maxIterations);
          
          for (const sq of prioritizedSubqueries) {
            await enqueueSearchJob(taskId, organizationId, mainQuery, sq.query, sq.purpose, mode, taskSpec);
          }
        } else if (subqueries.length > 0 && currentIteration >= maxIterations) {
          console.log(`[Task ${taskId}] EVALUATE found gaps but max iterations reached. Running verification then synthesizing.`);
          // Enqueue verification before synthesis for DEEP mode
          if (mode === "DEEP" && aggregatedFacts.length > 0) {
            await enqueueVerifyJob(taskId, organizationId, mainQuery, aggregatedFacts, taskEvidences, mode);
          } else {
            await enqueueSynthesizeJob(taskId, organizationId, mainQuery, taskSpec, responseFormat);
          }
        } else {
          console.log(`[Task ${taskId}] EVALUATE satisfied. Running verification then synthesizing.`);
          // Enqueue verification before synthesis for DEEP mode
          if (mode === "DEEP" && aggregatedFacts.length > 0) {
            await enqueueVerifyJob(taskId, organizationId, mainQuery, aggregatedFacts, taskEvidences, mode);
          } else {
            await enqueueSynthesizeJob(taskId, organizationId, mainQuery, taskSpec, responseFormat);
          }
        }
      } catch (err) {
        await failWorkerRun(run.id, err);
        throw err;
      }
    }

    else if (job.name === "VERIFY") {
      console.log(`[Task ${taskId}] Starting VERIFY job for cross-source verification...`);
      const run = await createWorkerRun(taskId, "VERIFY", "openrouter", "gpt-4o-mini", { query: mainQuery });
      try {
        const { claims, sources } = job.data;
        
        const verifier = new VerificationWorker({ mode });
        const result = await verifier.execute(taskId, {
          query: mainQuery,
          claims: claims,
          sources: sources,
          mode
        }, taskContext);

        const cost = result.usage?.cost || 0;
        taskContext.recordWorkerUsage(`verify_${run.id}`, result.usage, cost);
        await completeWorkerRun(run.id, result, cost, result.usage);

        // Filter claims based on verification results
        const filteredClaims = VerificationWorker.filterByVerification(claims, result.verifications, 'MEDIUM');
        console.log(`[Task ${taskId}] Verification filtered ${claims.length} claims to ${filteredClaims.length} high-confidence claims.`);

        // Update task with verification stats
        const verificationStats = VerificationWorker.aggregateVerifications(result.verifications);
        console.log(`[Task ${taskId}] Verification stats: ${JSON.stringify(verificationStats)}`);

        // Proceed to synthesis with verified claims
        await enqueueSynthesizeJob(taskId, organizationId, mainQuery, taskSpec, responseFormat);
      } catch (err) {
        await failWorkerRun(run.id, err);
        throw err;
      }
    }

    else if (job.name === "SYNTHESIZE") {
      console.log(`[Task ${taskId}] Starting SYNTHESIZE job...`);
      await prisma.task.update({ where: { id: taskId }, data: { status: "SYNTHESIZING" } });
      const run = await createWorkerRun(taskId, "SYNTHESIZE", "openrouter", "gpt-4o-mini", { query: mainQuery, taskSpec });
      
      try {
        console.log(`[Task ${taskId}] Fetching task evidence...`);
        // Fetch all TaskEvidence for this task
        const taskEvidences = await prisma.taskEvidence.findMany({
          where: { taskId, organizationId }
        });
        
        console.log(`[Task ${taskId}] Found ${taskEvidences.length} evidence records`);
        
        const EvidenceAggregator = require("../modules/tasks/evidenceAggregator");
        console.log(`[Task ${taskId}] Aggregating evidence...`);
        const aggregatedFacts = EvidenceAggregator.aggregate(taskEvidences);
        
        console.log(`[Task ${taskId}] Aggregated ${aggregatedFacts.length} facts for synthesis`);
        
        const rawSources = [...new Set(aggregatedFacts.flatMap(f => f.sources))];
        console.log(`[Task ${taskId}] Processing ${rawSources.length} unique sources`);
        const processedSources = SourceManager.processSources(rawSources);

        console.log(`[Task ${taskId}] Starting synthesis worker...`);
        const synthesizer = new SynthesisWorker({ mode });
        const result = await synthesizer.execute(taskId, {
          query: mainQuery,
          taskSpec,
          responseFormat,
          facts: aggregatedFacts.map(f => ({
            claim: f.claim,
            evidence: f.evidenceText,
            confidence: f.confidence,
            sources: f.sources,
            type: f.type,
            category: f.category
          })),
          sources: processedSources.map(s => `[${s.id}] ${s.url}`),
          mode
        }, taskContext);

        console.log(`[Task ${taskId}] Synthesis worker completed`);
        const cost = result.usage?.cost || 0;
        console.log(`[Task ${taskId}] Recording worker usage`);
        taskContext.recordWorkerUsage('synthesis', result.usage, cost);
        console.log(`[Task ${taskId}] Completing worker run`);
        await completeWorkerRun(run.id, result, cost, result.usage);
        console.log(`[Task ${taskId}] Mapping metrics updated`);
        EventMapper.mapMetricsUpdated(taskId, 'synthesis', taskContext);
        console.log(`[Task ${taskId}] Mapping worker completed`);
        EventMapper.mapWorkerCompleted(taskId, 'synthesis', { status: 'success' });

        // Record final quality metrics
        console.log(`[Task ${taskId}] Recording quality metrics`);
        const taskMetrics = taskContext.getMetrics();
        
        // Temporarily disable quality metrics recording to fix hang
        // qualityMetricsService.recordPipelineMetrics(taskId, {
        //   latency: task.executionTimeMs,
        //   tokens: taskMetrics.tokens.total,
        //   cost: cost,
        //   success: true,
        //   cacheHits: taskMetrics.tokens.cached || 0
        // });

        // qualityMetricsService.recordResearchMetrics(taskId, {
        //   sourceQuality: qualityReport.averageScore,
        //   factConfidence: taskMetrics.facts > 0 ? 80 : 50, // Simplified confidence
        //   contradictionRate: 0.1, // Would be calculated from actual contradictions
        //   verificationPass: 0.9, // Would be calculated from actual verification
        //   sourceDiversity: qualityReport.domainDistribution ? Object.keys(qualityReport.domainDistribution).length : 3
        // });

        console.log(`[Task ${taskId}] Quality metrics recording skipped (temporarily disabled)`);

        // Fetch all worker runs to compute metrics
        console.log(`[Task ${taskId}] Fetching worker runs for metrics`);
        const allRuns = await prisma.workerRun.findMany({ where: { taskId } });
        console.log(`[Task ${taskId}] Found ${allRuns.length} worker runs`);
        const MetricsAggregator = require("../modules/tasks/metricsAggregator");
        console.log(`[Task ${taskId}] Aggregating metrics`);
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
  if (["PLAN", "SEARCH", "SCRAPE", "EXTRACT", "EVALUATE"].includes(job.name)) {
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
        const isEvaluateEnqueued = [...activeJobs, ...waitingJobs, ...delayedJobs].some(
          j => j.data?.taskId === taskId && j.name === "EVALUATE"
        );
        
        if (!isSynthesizeEnqueued && !isEvaluateEnqueued) {
           let maxIterations = 2; // STANDARD
           if (task.mode === "FAST") maxIterations = 1;
           if (task.mode === "DEEP") maxIterations = 3;

           if (task.iteration < maxIterations && job.name !== "EVALUATE") {
             await enqueueEvaluateJob(taskId, organizationId, task.query, taskSpec, responseFormat, task.iteration);
           } else {
             await enqueueSynthesizeJob(taskId, organizationId, task.query, taskSpec, responseFormat);
           }
        }
      }
    }
  }
}

worker.on("completed", checkAndTriggerSynthesize);
worker.on("failed", checkAndTriggerSynthesize);

module.exports = worker;
