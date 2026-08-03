import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/StatusBadge'
import { Separator } from '@/components/ui/separator'
import {
  ChevronLeft,
  Clock,
  Coins,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  FileText,
  GitBranch,
  Terminal,
  Code2,
  Globe,
  CheckCircle2,
} from 'lucide-react'

const MOCK_TASK_DETAILS = {
  id: 'tsk_9f83a1b2',
  prompt: 'Comprehensive market analysis for enterprise agentic AI architectures in 2026',
  status: 'COMPLETED',
  createdAt: '2026-08-02T12:30:14Z',
  completedAt: '2026-08-02T12:30:18.2Z',
  duration: '4.2s',
  totalTokens: 42800,
  promptTokens: 8400,
  completionTokens: 34400,
  cost: 0.0428,
  parameters: {
    depth: 'deep',
    verifySources: true,
    maxWorkers: 6,
    models: ['openai/o3-mini', 'claude-3-7-sonnet'],
  },
  workers: [
    {
      id: 'wrk_01',
      name: 'Orchestrator & DAG Planner',
      type: 'PLANNER',
      status: 'COMPLETED',
      duration: '420ms',
      tokens: 3200,
      details: 'Formulated 4 search sub-objectives and distributed to 4 web agents.',
    },
    {
      id: 'wrk_02',
      name: 'Agentic Frameworks Crawler',
      type: 'SEARCHER',
      status: 'COMPLETED',
      duration: '1.2s',
      tokens: 9800,
      details: 'Extracted architectural specifications from LangGraph, AutoGen, CrewAI, and Semantic Kernel.',
    },
    {
      id: 'wrk_03',
      name: 'Market Adoption & CapEx Analyst',
      type: 'SEARCHER',
      status: 'COMPLETED',
      duration: '1.4s',
      tokens: 11400,
      details: 'Retrieved Gartner, IDC, and Morgan Stanley reports on enterprise LLM capex budgets for 2026.',
    },
    {
      id: 'wrk_04',
      name: 'Evaluation & Benchmarks Worker',
      type: 'SEARCHER',
      status: 'COMPLETED',
      duration: '980ms',
      tokens: 6200,
      details: 'Collected SWE-bench, GAIA, and WebArena pass@1 metrics across leading reasoning agents.',
    },
    {
      id: 'wrk_05',
      name: 'Citation & Fact Verification Node',
      type: 'VERIFIER',
      status: 'COMPLETED',
      duration: '650ms',
      tokens: 4400,
      details: 'Validated 18 citation claims against original HTTP sources. 100% precision.',
    },
    {
      id: 'wrk_06',
      name: 'Executive Synthesis Engine',
      type: 'SYNTHESIZER',
      status: 'COMPLETED',
      duration: '850ms',
      tokens: 7800,
      details: 'Compiled verified findings into executive summary with strategic roadmap and ROI models.',
    },
  ],
  citations: [
    { title: 'Gartner Magic Quadrant for Enterprise Agentic Systems (2026)', url: 'https://gartner.com/research/agentic-ai-2026', domain: 'gartner.com' },
    { title: 'OpenAI o3 and Next-Gen Reasoning Pipelines Technical Report', url: 'https://openai.com/research/o3-reasoning', domain: 'openai.com' },
    { title: 'Anthropic: Multi-Agent Systems in Production Architecture Guide', url: 'https://anthropic.com/multi-agent-guide', domain: 'anthropic.com' },
    { title: 'Morgan Stanley Tech Equity: The $120B Agentic Infrastructure Shift', url: 'https://morganstanley.com/insights/ai-infrastructure', domain: 'morganstanley.com' },
  ],
  report: `# Executive Report: Enterprise Agentic AI Architectures (2026 Outlook)

## 1. Executive Summary
The transition from monolithic foundation model prompting to **autonomous, multi-agent reasoning DAGs** represents the defining paradigm shift for enterprise software in 2026. Rather than relying on single long-context inferences, top-tier deployments utilize distributed topologies where specialized sub-agents handle planning, web retrieval, programmatic code validation, and cross-verification in parallel.

## 2. Key Architecture Paradigms
- **Hierarchical Orchestration (Planner-Worker DAGs):** A central coordinator decomposes complex enterprise queries into discrete, non-dependent sub-tasks.
- **Dynamic Context Isolation:** Each sub-worker operates within a strictly partitioned token context, reducing hallucination by 78% compared to single-agent setups.
- **Deterministic Tool Verification:** Outputs are validated by deterministic linters, unit test sandboxes, and secondary fact-checking agents before compilation into the final synthesis.

## 3. Financial Impact & Token Efficiency
- **Cost Reduction:** Multi-agent specialized routing yields an average **43% token cost reduction** compared to naive brute-force deep reasoning models.
- **Accuracy Benchmarks:** On enterprise compliance and multi-hop research benchmarks (GAIA & SWE-bench), multi-agent architectures achieve an **88.4% pass@1** vs 64.2% for single model calls.`,
  logs: `[12:30:14.012] [INFO] [DAG-Master] Task initialized with depth='deep', verifySources=true
[12:30:14.120] [INFO] [Planner] Formulated 4 parallel sub-objectives
[12:30:14.432] [INFO] [Worker-1] Dispatched agent to crawl framework repositories...
[12:30:14.435] [INFO] [Worker-2] Dispatched agent to financial analyst research sources...
[12:30:14.440] [INFO] [Worker-3] Fetching benchmark evaluation datasets...
[12:30:15.632] [INFO] [Worker-1] Retrieved 9,800 tokens from 4 endpoints
[12:30:15.835] [INFO] [Worker-2] Retrieved 11,400 tokens from 6 reports
[12:30:16.415] [INFO] [Worker-3] Benchmark metrics extraction completed
[12:30:16.820] [INFO] [Verifier] Starting cross-verification of 18 extracted claims...
[12:30:17.470] [INFO] [Verifier] 18/18 claims confirmed against official sources (100% precision)
[12:30:17.472] [INFO] [Synthesizer] Assembling final executive markdown specification...
[12:30:18.322] [SUCCESS] [DAG-Master] Pipeline execution completed in 4.2s (Total tokens: 42,800, Cost: $0.0428)`,
}

function TaskDetailFallback() {
  return (
    <div className="w-full space-y-5 p-1">
      <div className="flex items-center gap-2">
        <UiSkeleton className="h-4 w-28 rounded" />
      </div>
      <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <UiSkeleton className="h-6 w-36 rounded" />
            <UiSkeleton className="h-4 w-96 rounded" />
          </div>
          <UiSkeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <UiSkeleton className="h-3 w-16 rounded" />
              <UiSkeleton className="h-5 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
      <UiSkeleton className="h-10 w-80 rounded-lg" />
      <UiSkeleton className="h-80 w-full rounded-2xl" />
    </div>
  )
}

export default function TaskDetail() {
  const { isSyncing } = useAuth()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('report')
  const [copiedReport, setCopiedReport] = useState(false)

  const task = MOCK_TASK_DETAILS

  const handleCopyReport = () => {
    navigator.clipboard.writeText(task.report)
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 2000)
  }

  return (
    <Skeleton
      name="task-detail-page"
      loading={isSyncing}
      fallback={<TaskDetailFallback />}
      className="w-full min-w-0"
    >
      <div className="space-y-5">
      {/* Header with Breadcrumb & Actions */}
      <div className="space-y-3">
        <Button asChild variant="ghost" size="xs" className="rounded-md -ml-2 text-xs text-muted-foreground hover:text-foreground">
          <Link to="/dashboard/tasks">
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back to Tasks
          </Link>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                {task.id}
              </span>
              <StatusBadge status={task.status} />
              <Badge variant="outline" className="text-[10px] font-normal capitalize">
                {task.parameters.depth} Research
              </Badge>
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
              {task.prompt}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyReport}
              className="rounded text-xs h-8 gap-1.5 cursor-pointer"
            >
              {copiedReport ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copiedReport ? 'Copied' : 'Copy Report'}
            </Button>
            <Button
              size="xs"
              className="rounded text-xs h-8 font-semibold text-white cursor-pointer shadow-xs"
              style={{ background: 'var(--seq-btn-grad)' }}
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Re-run Task
            </Button>
          </div>
        </div>
      </div>

      {/* Telemetry Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-card border border-border shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" /> Total Latency
          </span>
          <p className="text-base font-bold font-mono">{task.duration}</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Coins className="h-3 w-3 text-amber-400" /> Total Cost
          </span>
          <p className="text-base font-bold font-mono text-emerald-400">${task.cost.toFixed(4)}</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Cpu className="h-3 w-3 text-violet-400" /> Token Volume
          </span>
          <p className="text-base font-bold font-mono">{task.totalTokens.toLocaleString()}</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3 text-fuchsia-400" /> Parallel Nodes
          </span>
          <p className="text-base font-bold font-mono">{task.workers.length} Agents</p>
        </div>
      </div>

      {/* Main Tabs: Report, Trace DAG, Live Logs, Raw Spec */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="rounded-lg bg-muted/40 p-0.5 mb-4 h-8">
          <TabsTrigger value="report" className="rounded-md text-xs h-7 gap-1">
            <FileText className="h-3 w-3" /> Synthesized Report
          </TabsTrigger>
          <TabsTrigger value="trace" className="rounded-md text-xs h-7 gap-1">
            <GitBranch className="h-3 w-3" /> Agent Trace DAG
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-md text-xs h-7 gap-1">
            <Terminal className="h-3 w-3" /> Pipeline Logs
          </TabsTrigger>
          <TabsTrigger value="raw" className="rounded-md text-xs h-7 gap-1">
            <Code2 className="h-3 w-3" /> JSON Output
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Synthesized Report */}
        <TabsContent value="report" className="space-y-4">
          <Card className="rounded-xl border-border bg-card shadow-xs">
            <CardContent className="p-5 prose dark:prose-invert max-w-none text-xs leading-relaxed">
              <div className="space-y-4 whitespace-pre-wrap font-sans text-foreground">
                {task.report}
              </div>

              <Separator className="my-5" />

              {/* Citations Footer */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Verified Citations ({task.citations.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {task.citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between group text-xs"
                    >
                      <div className="space-y-0.5 truncate mr-2">
                        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors text-[11px]">
                          {c.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Globe className="h-2.5 w-2.5" /> {c.domain}
                        </span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 group-hover:text-primary" />
                    </a>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Agent Trace DAG */}
        <TabsContent value="trace" className="space-y-3">
          <Card className="rounded-xl border-border bg-card shadow-xs">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-bold">Execution Trace Tree</CardTitle>
              <CardDescription className="text-xs">
                Detailed breakdown of each autonomous sub-agent in the pipeline DAG.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 px-4 pb-4">
              {task.workers.map((worker, index) => (
                <div
                  key={worker.id}
                  className="p-3.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center font-mono">
                        {index + 1}
                      </span>
                      <h4 className="font-semibold text-xs">{worker.name}</h4>
                      <Badge variant="outline" className="text-[9px] font-mono uppercase px-1 py-0">
                        {worker.type}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground ml-7">{worker.details}</p>
                  </div>

                  <div className="flex items-center gap-3 ml-7 md:ml-0 shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-[11px] font-semibold">{worker.duration}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">
                        {worker.tokens.toLocaleString()} tokens
                      </p>
                    </div>
                    <StatusBadge status={worker.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Pipeline Logs */}
        <TabsContent value="logs">
          <Card className="rounded-xl border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div>
                <CardTitle className="text-sm font-bold">Live Execution Stream</CardTitle>
                <CardDescription className="text-xs">Server-sent event logs emitted during pipeline lifecycle</CardDescription>
              </div>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Closed (4.2s)
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <pre className="p-3.5 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-zinc-800">
                <code>{task.logs}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Raw JSON Output */}
        <TabsContent value="raw">
          <Card className="rounded-xl border-border bg-card shadow-xs">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-bold">Standard TaskSpec JSON</CardTitle>
              <CardDescription className="text-xs">Structured response schema returned to API clients</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <pre className="p-3.5 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-zinc-800">
                <code>{JSON.stringify(task, null, 2)}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </Skeleton>
  )
}
