import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Clock,
  ExternalLink,
  Code2,
  Play,
  RotateCw,
  Copy,
  Check,
  Zap,
  Globe,
  Database,
  Cpu,
  Sparkles,
  Search,
  Filter,
  Layers,
  FileCode,
  Terminal,
  Download,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react'

const SAMPLE_PROMPTS = [
  'Analyze recent trends in enterprise agentic AI architectures in 2026',
  'Compare token efficiency and latency across Claude 3.7 Sonnet vs OpenAI o3-mini',
  'Synthesize cross-border regulatory compliance guidelines for FinTech AI deployment',
]

const INITIAL_HISTORY = [
  {
    id: 'tsk_9f83a1b2',
    query: 'Comprehensive market analysis for enterprise agentic AI architectures in 2026',
    status: 'COMPLETED',
    mode: 'DEEP',
    workerCount: 6,
    citationCount: 18,
    duration: '4.2s',
    tokens: 42800,
    cost: 0.0428,
    createdAt: '10 mins ago',
    output: {
      answer: `### Executive Summary\n\nEnterprise adoption of agentic AI architectures has accelerated rapidly in 2026, transitioning from single-turn LLM pipelines to multi-agent distributed systems capable of autonomous tool calling, continuous state persistence, and real-time environment validation.\n\n### Key Architectural Trends\n\n1. **Deterministic DAG Execution**: Modern workflows isolate critical validation layers to prevent cascade hallucination.\n2. **Hybrid Synthesis Layers**: Blending sub-100ms reasoning models with deep verification models reduces total unit cost by 40%.\n3. **Decentralized Memory Graphs**: Multi-modal memory vector stores enable cross-session task retrieval with zero latency overhead.`,
      sources: [
        { title: 'State of Multi-Agent Systems 2026', url: 'https://arxiv.org/abs/2603.1892' },
        { title: 'Enterprise AI Infrastructure Report', url: 'https://research.sequential.ai/infra-2026' },
      ],
    },
  },
  {
    id: 'tsk_7e62c4d8',
    query: 'Synthesize cross-border regulatory compliance guidelines for FinTech AI deployment',
    status: 'COMPLETED',
    mode: 'STANDARD',
    workerCount: 4,
    citationCount: 9,
    duration: '1.8s',
    tokens: 18400,
    cost: 0.0184,
    createdAt: '25 mins ago',
    output: {
      answer: `### Regulatory Framework Overview\n\nFinTech deployments in EU and US jurisdictions require mandatory audit tracing on automated decisions, structured liability contracts, and model explainability metrics.`,
      sources: [
        { title: 'EU AI Act Tier 2 Compliance', url: 'https://compliance.eu/ai-act' },
      ],
    },
  },
  {
    id: 'tsk_3b19f0a4',
    query: 'Benchmarking latency and token efficiency across Claude 3.7 Sonnet vs OpenAI o3-mini',
    status: 'COMPLETED',
    mode: 'FAST',
    workerCount: 2,
    citationCount: 6,
    duration: '1.1s',
    tokens: 8200,
    cost: 0.0082,
    createdAt: '2 hours ago',
    output: {
      answer: `### Benchmark Results\n\n- **Latency**: o3-mini delivers 35ms TTFT on reasoning tasks, whereas Claude 3.7 maintains superior structural code accuracy.\n- **Cost Efficiency**: Hybrid routing delivers 65% cost reduction.`,
      sources: [
        { title: 'LLM Latency Benchmarks Q3', url: 'https://benchmarks.ai/latency' },
      ],
    },
  },
]

function TasksFallback() {
  return (
    <div className="w-full space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UiSkeleton className="h-8 w-32 rounded-lg" />
          <UiSkeleton className="h-7 w-24 rounded-lg" />
        </div>
        <UiSkeleton className="h-8 w-44 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-6 rounded-2xl border border-border/80 bg-card space-y-4">
          <UiSkeleton className="h-5 w-32 rounded" />
          <UiSkeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <UiSkeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <UiSkeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-7 p-6 rounded-2xl border border-border/80 bg-card space-y-4">
          <div className="flex justify-between items-center">
            <UiSkeleton className="h-5 w-36 rounded" />
            <UiSkeleton className="h-7 w-48 rounded-lg" />
          </div>
          <UiSkeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const { isSyncing } = useAuth()
  const [searchParams] = useSearchParams()
  const initialView = searchParams.get('tab') === 'history' ? 'history' : 'playground'
  const [activeView, setActiveView] = useState(initialView)

  // Prompt Playground State
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('FAST') // FAST | STANDARD | DEEP
  const [isStructuredOutput, setIsStructuredOutput] = useState(false)
  const [schemaTemplate, setSchemaTemplate] = useState('{\n  "title": "string",\n  "keyFindings": ["string"],\n  "confidenceScore": 0.95\n}')

  // Execution State
  const [isRunning, setIsRunning] = useState(false)
  const [currentResult, setCurrentResult] = useState(null)
  const [executionStep, setExecutionStep] = useState('')
  const [activeResultTab, setActiveResultTab] = useState('output') // 'output' | 'trace' | 'json'

  // Code Dialog State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('python') // 'python' | 'node' | 'curl'
  const [isCopied, setIsCopied] = useState(false)

  // History State
  const [historyList, setHistoryList] = useState(INITIAL_HISTORY)
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('ALL')

  // Run Task Simulation / Real Execution
  const handleRunTask = () => {
    if (!prompt.trim() || isRunning) return

    setIsRunning(true)
    setCurrentResult(null)
    setExecutionStep('Planning execution DAG...')

    setTimeout(() => {
      setExecutionStep(
        mode === 'DEEP'
          ? 'Dispatching 6 parallel research workers...'
          : mode === 'STANDARD'
            ? 'Dispatching 4 research workers...'
            : 'Querying synthesis engine...'
      )
    }, 600)

    setTimeout(() => {
      setExecutionStep('Aggregating citations & synthesizing answer...')
    }, 1300)

    setTimeout(() => {
      const generatedResult = {
        id: `tsk_${Date.now().toString(36)}`,
        query: prompt,
        mode,
        status: 'COMPLETED',
        duration: mode === 'DEEP' ? '3.8s' : mode === 'STANDARD' ? '2.1s' : '0.9s',
        tokens: mode === 'DEEP' ? 34200 : mode === 'STANDARD' ? 18600 : 7400,
        cost: mode === 'DEEP' ? 0.0342 : mode === 'STANDARD' ? 0.0186 : 0.0074,
        workerCount: mode === 'DEEP' ? 6 : mode === 'STANDARD' ? 4 : 2,
        createdAt: 'Just now',
        output: {
          answer: `### Results for "${prompt}"\n\nSequential AI synthesized results across multiple verified sources.\n\n1. **Core Findings**: The research pipeline parsed domain metrics, identifying key dependencies and quantitative indicators.\n2. **Optimization Opportunities**: Integrating structured pipelines yields a **3.4x throughput increase** with minimal latency.\n3. **Recommended Next Steps**: Deploy task webhooks to stream step-by-step progress events directly into your application stack.`,
          structuredData: isStructuredOutput
            ? {
              title: prompt.slice(0, 40),
              keyFindings: [
                'High confidence extraction completed',
                'Zero cascade hallucination detected',
                'Latency within acceptable thresholds',
              ],
              confidenceScore: 0.98,
            }
            : null,
          sources: [
            { title: 'Sequential Research Index', url: 'https://docs.sequential.ai' },
            { title: 'Global AI Benchmark Archive', url: 'https://benchmarks.ai' },
            { title: 'Enterprise Technical Specs', url: 'https://sequential.ai/docs/sdk-usage' },
          ],
        },
      }

      setCurrentResult(generatedResult)
      setHistoryList([generatedResult, ...historyList])
      setIsRunning(false)
      setExecutionStep('')
    }, 2100)
  }

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleRunTask()
    }
  }

  // Generate Code Snippets
  const getCodeSnippet = () => {
    const currentQuery = prompt || 'Analyze recent trends in enterprise agentic AI architectures in 2026'

    if (selectedLanguage === 'python') {
      return `import sequential

# Initialize Sequential Client
client = sequential.Client(api_key="sk_live_seq_...")

# Create & Run Task
task = client.tasks.create(
    query="${currentQuery}",
    mode="${mode}",${isStructuredOutput
          ? `\n    task_spec={\n        "format": "json",\n        "schema": ${schemaTemplate}\n    }`
          : ''
        }
)

print(f"Task ID: {task.id} | Status: {task.status}")
print(task.output.answer)`
    }

    if (selectedLanguage === 'node') {
      return `import { SequentialAI } from "@sequential-ai/sdk";

const client = new SequentialAI({
  apiKey: process.env.SEQUENTIAL_API_KEY,
});

async function run() {
  const task = await client.tasks.create({
    query: "${currentQuery}",
    mode: "${mode}",${isStructuredOutput
          ? `\n    taskSpec: {\n      format: "json",\n      schema: ${schemaTemplate}\n    },`
          : ''
        }
  });

  console.log("Task ID:", task.id);
  console.log("Output:", task.output.answer);
}

run();`
    }

    return `curl -X POST https://api.sequential.ai/v1/tasks \\
  -H "Authorization: Bearer sk_live_seq_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "${currentQuery}",
    "mode": "${mode}"${isStructuredOutput
        ? `,\n    "taskSpec": { "format": "json" }`
        : ''
      }
  }'`
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet())
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Skeleton
      name="tasks-page"
      loading={isSyncing}
      fallback={<TasksFallback />}
      className="w-full min-w-0"
    >
      <div className="w-full space-y-6">
      {/* Header Row: Title, History Toggle & Quickstart Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Task API</h1>

          <button
            type="button"
            onClick={() => setActiveView(activeView === 'playground' ? 'history' : 'playground')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono uppercase transition-all cursor-pointer border ${activeView === 'history'
              ? 'bg-foreground text-background border-foreground'
              : 'border-border/80 text-muted-foreground hover:text-foreground bg-card hover:bg-muted'
              }`}
          >
            <Clock className="h-3.5 w-3.5" />
            HISTORY
          </button>
        </div>

        {/* Task API Quickstart Card */}
        <a
          href="https://docs.sequential.ai"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-card hover:border-primary/50 transition-all shadow-2xs group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground group-hover:text-primary transition-colors">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors inline-flex items-center gap-1">
              Task API Quickstart
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
            </span>
            <span className="text-[11px] text-muted-foreground">
              Make your first API call in minutes
            </span>
          </div>
        </a>
      </div>

      {/* Main View: Playground */}
      {activeView === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Try any prompt with the Task API */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Try any prompt with the Task API
              </h2>

              {/* GET API CODE Button */}
              <Button
                size="sm"
                onClick={() => setIsCodeModalOpen(true)}
                className="rounded-lg h-8 px-3.5 text-xs font-bold uppercase text-white shadow-xs cursor-pointer flex items-center gap-1.5 font-mono"
                style={{ background: 'var(--primary, #F2541B)' }}
              >
                <Code2 className="h-3.5 w-3.5" />
                GET API CODE
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              The Task API turns a prompt or input into a reusable, tunable workflow you can refine, rerun, and integrate into real product experiences without rebuilding everything from scratch each time.
            </p>

            {/* Input Box Card */}
            <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3 relative">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Input</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Cmd/Ctrl+Enter to run
                </span>
              </div>

              {/* Textarea */}
              <Textarea
                placeholder="Ask any question, summary, extraction, comparisons, web-research, or structured answer."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={5}
                className="resize-none rounded-xl border border-border/70 bg-background/50 focus:bg-background text-xs sm:text-sm p-3 leading-relaxed placeholder:text-muted-foreground/60 shadow-inner"
              />

              {/* Sample Prompts Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Try:</span>
                {SAMPLE_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sample)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors truncate max-w-xs cursor-pointer text-left"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {/* Optional Structured Output Schema Editor */}
              {isStructuredOutput && (
                <div className="pt-2 border-t border-border/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-foreground">TaskSpec JSON Schema</span>
                    <span className="text-[10px] text-muted-foreground">Enforces strict structured typing</span>
                  </div>
                  <Textarea
                    value={schemaTemplate}
                    onChange={(e) => setSchemaTemplate(e.target.value)}
                    rows={3}
                    className="font-mono text-xs rounded-lg bg-muted/30 border border-border/70 p-2 text-foreground resize-none"
                  />
                </div>
              )}

              {/* Bottom Toolbar inside Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {/* Structured Output Switch */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                    <span className="font-mono text-xs">{'{ }'} Structured output</span>
                    <Switch
                      checked={isStructuredOutput}
                      onCheckedChange={setIsStructuredOutput}
                      className="scale-90"
                    />
                  </label>

                  {/* Mode / Speed Selector (FAST | STANDARD | DEEP) */}
                  <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/30">
                    {['FAST', 'STANDARD', 'DEEP'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold uppercase transition-all cursor-pointer ${mode === m
                          ? 'bg-background text-primary shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* RUN Button */}
                <Button
                  size="sm"
                  disabled={!prompt.trim() || isRunning}
                  onClick={handleRunTask}
                  className="rounded-lg h-8 px-5 text-xs font-bold uppercase text-white shadow-xs cursor-pointer flex items-center gap-1.5 font-mono"
                  style={{ background: 'var(--primary, #F2541B)' }}
                >
                  {isRunning ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      RUNNING...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      RUN
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Bottom Helper text matching reference */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Inputs to the task API can also be JSON objects. If you want to define each field in your input object, you can provide an input JSON schema in your request.{' '}
              <a
                href="https://docs.sequential.ai"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                Read more about it here ↗
              </a>
            </p>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Results</h2>
              {currentResult && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentResult.output.answer)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Output
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Real-time execution steps, synthesis outputs, and execution metrics.
            </p>

            {/* Results Container Card */}
            <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs min-h-[380px] flex flex-col justify-between">
              {isRunning ? (
                /* Running / Synthesis Progress State */
                <div className="my-auto text-center space-y-4 py-12">
                  <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                    <RotateCw className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Executing Task Pipeline
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono animate-pulse">
                      {executionStep}
                    </p>
                  </div>
                </div>
              ) : currentResult ? (
                /* Completed Result State */
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Execution Metrics Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">STATUS</span>
                        <Badge variant="outline" className="mt-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                          COMPLETED
                        </Badge>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">LATENCY</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{currentResult.duration}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">TOKENS</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{currentResult.tokens.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">UNIT COST</span>
                        <span className="font-semibold text-foreground mt-0.5 block">${currentResult.cost.toFixed(4)}</span>
                      </div>
                    </div>

                    {/* View Switcher: Output | Trace | JSON */}
                    <div className="flex items-center gap-4 border-b border-border/70 pb-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveResultTab('output')}
                        className={`font-semibold cursor-pointer transition-colors ${activeResultTab === 'output'
                          ? 'text-primary border-b-2 border-primary pb-1 -mb-2'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        Synthesis Output
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveResultTab('trace')}
                        className={`font-semibold cursor-pointer transition-colors ${activeResultTab === 'trace'
                          ? 'text-primary border-b-2 border-primary pb-1 -mb-2'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        Execution Trace ({currentResult.workerCount} workers)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveResultTab('json')}
                        className={`font-semibold cursor-pointer transition-colors ${activeResultTab === 'json'
                          ? 'text-primary border-b-2 border-primary pb-1 -mb-2'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        Raw JSON
                      </button>
                    </div>

                    {/* Tab: Synthesis Output */}
                    {activeResultTab === 'output' && (
                      <div className="space-y-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed space-y-2 font-sans">
                          {currentResult.output.answer.split('\n\n').map((para, i) => (
                            <p key={i} className="text-foreground/90">{para}</p>
                          ))}
                        </div>

                        {/* Structured Output preview if present */}
                        {currentResult.output.structuredData && (
                          <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1.5">
                            <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground block">
                              Structured Object Output
                            </span>
                            <pre className="font-mono text-xs text-foreground overflow-x-auto">
                              {JSON.stringify(currentResult.output.structuredData, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Sources & Citations */}
                        {currentResult.output.sources?.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border/60">
                            <span className="text-[11px] font-semibold text-muted-foreground block">
                              Verified Citations ({currentResult.output.sources.length})
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {currentResult.output.sources.map((src, idx) => (
                                <a
                                  key={idx}
                                  href={src.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] px-2 py-1 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors font-mono"
                                >
                                  <Globe className="h-3 w-3 text-primary" />
                                  <span className="truncate max-w-[180px]">{src.title}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Execution Trace */}
                    {activeResultTab === 'trace' && (
                      <div className="space-y-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>1. Planning & DAG Generation</span>
                          </div>
                          <span className="text-muted-foreground">0.24s</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>2. Parallel Search & Extraction ({currentResult.workerCount} Workers)</span>
                          </div>
                          <span className="text-muted-foreground">1.12s</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>3. Cross-Source Validation & Synthesis</span>
                          </div>
                          <span className="text-muted-foreground">0.74s</span>
                        </div>
                      </div>
                    )}

                    {/* Tab: Raw JSON */}
                    {activeResultTab === 'json' && (
                      <pre className="font-mono text-[11px] p-3 rounded-xl bg-muted/30 border border-border/70 overflow-x-auto text-foreground">
                        {JSON.stringify(currentResult, null, 2)}
                      </pre>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground text-[11px]">
                      Task ID: {currentResult.id}
                    </span>
                    <Link
                      to={`/dashboard/tasks/${currentResult.id}`}
                      className="text-primary hover:underline text-xs font-semibold inline-flex items-center gap-1"
                    >
                      Open Full Monitor <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Default Empty State */
                <div className="my-auto text-center space-y-3 py-16">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center text-foreground">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Ready to Run
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Enter a prompt or select a sample query to execute with the Sequential Task API pipeline.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* View: Task History Table */}
      {activeView === 'history' && (
        <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs space-y-0">
          <div className="p-4 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Execution History</h2>
              <p className="text-xs text-muted-foreground">Historical records of all Task API requests and synthesis runs.</p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Search prompt or Task ID..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="h-8 text-xs w-48 rounded-lg"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView('playground')}
                className="h-8 text-xs rounded-lg"
              >
                Back to Playground
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/70 text-[11px] font-mono font-medium text-muted-foreground/80 bg-muted/20">
                  <th className="py-2.5 px-4 font-semibold">Task ID</th>
                  <th className="py-2.5 px-4 font-semibold">Prompt Query</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Mode</th>
                  <th className="py-2.5 px-4 font-semibold">Latency</th>
                  <th className="py-2.5 px-4 font-semibold">Cost</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {historyList
                  .filter(
                    (t) =>
                      t.query.toLowerCase().includes(historySearch.toLowerCase()) ||
                      t.id.toLowerCase().includes(historySearch.toLowerCase())
                  )
                  .map((task) => (
                    <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        <Link to={`/dashboard/tasks/${task.id}`} className="hover:text-primary">
                          {task.id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-foreground truncate max-w-sm">
                        {task.query}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {task.mode}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{task.duration}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">${task.cost?.toFixed(4) || '0.0000'}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPrompt(task.query)
                            setMode(task.mode || 'FAST')
                            setActiveView('playground')
                          }}
                          className="h-7 px-2.5 text-xs text-primary font-semibold"
                        >
                          Load in Playground
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* GET API CODE Modal Dialog */}
      <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-5">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-base font-bold">API Code Snippet</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="rounded-lg h-7 px-2.5 text-xs flex items-center gap-1 font-mono"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? 'Copied' : 'Copy Code'}
              </Button>
            </div>
            <DialogDescription className="text-xs">
              Integrate this Task API call directly into your backend or application.
            </DialogDescription>
          </DialogHeader>

          {/* Language Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-border/70 pb-2 mt-2">
            {[
              { id: 'python', label: 'Python SDK' },
              { id: 'node', label: 'TypeScript / Node' },
              { id: 'curl', label: 'cURL' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedLanguage(lang.id)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${selectedLanguage === lang.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Code Container */}
          <div className="mt-2 relative rounded-xl bg-zinc-950 p-4 font-mono text-xs text-zinc-100 overflow-x-auto border border-zinc-800 shadow-inner">
            <pre>{getCodeSnippet()}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </Skeleton>
  )
}
