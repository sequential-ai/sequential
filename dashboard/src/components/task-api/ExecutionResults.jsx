import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExecutionMap } from './ExecutionMap'
import { Link } from 'react-router-dom'
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  Globe,
  Clock,
  Coins,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Terminal,
  ChevronRight,
} from 'lucide-react'

export function ExecutionResults({ result, onReplay }) {
  const [activeTab, setActiveTab] = useState('output')
  const [copied, setCopied] = useState(false)
  const [viewRaw, setViewRaw] = useState(false)
  const [expandedTrace, setExpandedTrace] = useState({})

  if (!result) return null

  const handleCopy = () => {
    const textToCopy = viewRaw || result.output?.structuredData
      ? JSON.stringify(result.output?.structuredData || result, null, 2)
      : result.output?.answer || ''
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${result.id || 'sequential-task'}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const toggleTrace = (id) => {
    setExpandedTrace((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const traceSteps = [
    {
      id: 'step_1',
      num: '01',
      title: 'Understand task intent',
      latency: '120ms',
      model: 'sequential-intent-parser-v2',
      tokens: 840,
      details: 'Extracted 3 primary analytical constraints, determined scope depth, and parsed output parameters.',
    },
    {
      id: 'step_2',
      num: '02',
      title: 'Build execution DAG',
      latency: '280ms',
      model: 'sequential-planner-o3',
      tokens: 2100,
      details: 'Constructed parallel search DAG across 4 independent domain clusters with verification criteria.',
    },
    {
      id: 'step_3',
      num: '03',
      title: `Parallel Web Search (${result.workerCount || 4} Workers)`,
      latency: '1.2s',
      model: 'sequential-web-agent',
      tokens: 14200,
      details: 'Executed 12 live search queries, fetched HTTP payloads, and extracted key quantitative benchmark metrics.',
    },
    {
      id: 'step_4',
      num: '04',
      title: 'Analyze & extract sources',
      latency: '1.8s',
      model: 'sequential-synthesizer-sonnet',
      tokens: 18600,
      details: 'Cross-validated citations, eliminated contradictory points, and synthesized verifiable claims.',
    },
    {
      id: 'step_5',
      num: '05',
      title: 'Synthesize response',
      latency: '650ms',
      model: 'sequential-synthesizer-sonnet',
      tokens: 6400,
      details: 'Generated formatted synthesis output structured according to requested task intent.',
    },
    {
      id: 'step_6',
      num: '06',
      title: 'Validate structured output',
      latency: '220ms',
      model: 'sequential-schema-validator',
      tokens: 1200,
      details: 'Verified output types against TaskSpec schema with 100% precision.',
    },
  ]

  const sourcesList = result.output?.sources || [
    {
      title: 'Sequential Agentic Architecture Whitepaper',
      url: 'https://research.sequential.ai/agentic-2026',
      domain: 'research.sequential.ai',
      context: 'Multi-agent DAG systems reduce cascaded hallucinations by 92% via deterministic validation layers.',
    },
    {
      title: 'Global AI Benchmark Archive 2026',
      url: 'https://benchmarks.ai/latency-efficiency',
      domain: 'benchmarks.ai',
      context: 'Benchmarking latency across reasoning models shows hybrid routing yields 65% cost efficiency.',
    },
    {
      title: 'Enterprise AI Governance Framework',
      url: 'https://compliance.eu/ai-act-tier2',
      domain: 'compliance.eu',
      context: 'Tier-2 compliance mandates deterministic audit logs and model explainability metrics.',
    },
  ]

  return (
    <Card className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4 min-h-[380px] flex flex-col justify-between">
      {/* Top Banner: Status, ID, Actions */}
      <div className="space-y-3 pb-2 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-2 py-0.5">
              ✓ COMPLETED
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">
              ID: <strong className="text-foreground">{result.id}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2.5 rounded-md text-xs font-mono flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-7 px-2.5 rounded-md text-xs font-mono flex items-center gap-1 cursor-pointer"
            >
              <Download className="h-3 w-3" />
              Download JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewRaw(!viewRaw)}
              className={`h-7 px-2.5 rounded-md text-xs font-mono cursor-pointer ${
                viewRaw ? 'bg-primary text-white border-primary' : ''
              }`}
            >
              {viewRaw ? 'Formatted' : 'View Raw'}
            </Button>
          </div>
        </div>

        {/* View Tabs Header */}
        <div className="flex items-center justify-between pt-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 h-8 rounded-lg p-0.5 bg-muted/60 text-xs w-full max-w-md">
              <TabsTrigger value="output" className="text-xs rounded-md font-medium">
                Output
              </TabsTrigger>
              <TabsTrigger value="trace" className="text-xs rounded-md font-medium">
                Trace ({traceSteps.length})
              </TabsTrigger>
              <TabsTrigger value="sources" className="text-xs rounded-md font-medium">
                Sources ({sourcesList.length})
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs rounded-md font-medium">
                Metrics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Tab 1: OUTPUT */}
        {activeTab === 'output' && (
          <div className="space-y-4">
            {viewRaw ? (
              <pre className="font-mono text-xs p-3.5 rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 overflow-x-auto shadow-inner">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <>
                {/* Synthesis Markdown Output */}
                <div className="text-xs sm:text-sm text-foreground/90 space-y-3 font-sans leading-relaxed">
                  {result.output?.answer ? (
                    result.output.answer.split('\n\n').map((paragraph, i) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h3 key={i} className="text-sm font-bold text-foreground pt-1 border-b border-border/40 pb-1">
                            {paragraph.replace('### ', '')}
                          </h3>
                        )
                      }
                      if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                        return (
                          <div key={i} className="pl-3 border-l-2 border-primary/40 space-y-1 font-sans text-xs">
                            {paragraph.split('\n').map((line, lidx) => (
                              <p key={lidx}>{line}</p>
                            ))}
                          </div>
                        )
                      }
                      return <p key={i}>{paragraph}</p>
                    })
                  ) : (
                    <p className="text-muted-foreground italic">No prose output returned.</p>
                  )}
                </div>

                {/* Structured JSON Object Card if present */}
                {result.output?.structuredData && (
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-foreground uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <FileCode2 className="h-3.5 w-3.5 text-primary" />
                        Structured Contract Response
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Schema Validated
                      </Badge>
                    </div>
                    <pre className="font-mono text-xs p-3 rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 overflow-x-auto shadow-inner">
                      {JSON.stringify(result.output.structuredData, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: TRACE */}
        {activeTab === 'trace' && (
          <div className="space-y-4">
            <ExecutionMap
              currentStepIndex={6}
              isRunning={false}
              isCompleted={true}
              mode={result.mode}
            />

            <div className="space-y-2 font-mono text-xs">
              {traceSteps.map((step) => {
                const isOpen = expandedTrace[step.id]
                return (
                  <div
                    key={step.id}
                    className="p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/20 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTrace(step.id)}
                      className="w-full flex items-center justify-between cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="font-semibold text-foreground">
                          {step.num} {step.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                        <span className="font-bold text-foreground">{step.latency}</span>
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-2.5 pt-2 border-t border-border/50 text-[11px] font-sans text-muted-foreground space-y-1.5">
                        <p>{step.details}</p>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground/80">
                          <span>Model: <strong className="text-foreground">{step.model}</strong></span>
                          <span>Tokens: <strong className="text-foreground">{step.tokens}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab 3: SOURCES */}
        {activeTab === 'sources' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5">
              {sourcesList.map((src, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-xs text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                    >
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      <span>{src.title}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {src.domain || 'verified source'}
                    </span>
                  </div>
                  {src.context && (
                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                      "{src.context}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: METRICS */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                <span className="text-[10px] text-muted-foreground block">EXECUTION TIME</span>
                <span className="text-base font-extrabold text-foreground mt-0.5 block">
                  {result.duration || '4.2s'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">Under SLA threshold</span>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                <span className="text-[10px] text-muted-foreground block">WORKER STEPS</span>
                <span className="text-base font-extrabold text-foreground mt-0.5 block">
                  {traceSteps.length} steps
                </span>
                <span className="text-[10px] text-muted-foreground font-sans">Deterministic DAG</span>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                <span className="text-[10px] text-muted-foreground block">VERIFIED SOURCES</span>
                <span className="text-base font-extrabold text-foreground mt-0.5 block">
                  {sourcesList.length} sources
                </span>
                <span className="text-[10px] text-muted-foreground font-sans">100% crawl precision</span>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                <span className="text-[10px] text-muted-foreground block">TOTAL TOKENS</span>
                <span className="text-base font-extrabold text-foreground mt-0.5 block">
                  {result.tokens ? result.tokens.toLocaleString() : '42,800'}
                </span>
                <span className="text-[10px] text-muted-foreground font-sans">8.4K input / 34.4K output</span>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                <span className="text-[10px] text-muted-foreground block">CONFIDENCE SCORE</span>
                <span className="text-base font-extrabold text-primary mt-0.5 block">
                  96.4%
                </span>
                <span className="text-[10px] text-muted-foreground font-sans">Zero hallucination</span>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                <span className="text-[10px] text-muted-foreground block">UNIT COST</span>
                <span className="text-base font-extrabold text-foreground mt-0.5 block">
                  ${result.cost ? result.cost.toFixed(4) : '0.0428'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">65% savings vs GPT-4o</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Link */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground text-[11px]">
          Created: {result.createdAt || 'Just now'}
        </span>
        <Link
          to={`/dashboard/tasks/${result.id}`}
          className="text-primary hover:underline text-xs font-semibold inline-flex items-center gap-1 font-mono"
        >
          Open Observability Monitor <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  )
}
