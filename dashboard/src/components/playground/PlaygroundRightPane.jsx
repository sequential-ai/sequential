import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Copy, Radio, Network, FileText, Code2, Layers, RotateCw, Search, CheckCircle2, ExternalLink, Brain, ChevronDown, ChevronRight } from 'lucide-react'
import CodeDialog from '@/components/CodeDialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ReactJsonModule from 'react-json-view'
const ReactJson = ReactJsonModule.default || ReactJsonModule
import { useTheme } from '@/context/ThemeContext'

// ─── Collapsible Reasoning Trace (Basis) Block ───────────────────────────────
function BasisBlock({ basis }) {
    const [expanded, setExpanded] = React.useState(true)
    if (!basis || basis.length === 0) return null

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer select-none group"
            >
                <Brain className="h-3.5 w-3.5 text-primary" />
                <span className="tracking-wider">Agent Reasoning Trace</span>
                {expanded
                    ? <ChevronDown className="h-3 w-3 opacity-60" />
                    : <ChevronRight className="h-3 w-3 opacity-60" />}
            </button>

            {expanded && basis.map((b, bi) => (
                <div
                    key={bi}
                    className="rounded-xl border border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.05] p-4 space-y-3"
                >
                    {/* Reasoning text */}
                    {b.reasoning && (
                        <div className="space-y-1">
                            <span className="text-[10px] font-mono font-semibold uppercase text-primary/60 tracking-wider">Reasoning</span>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{b.reasoning}</p>
                        </div>
                    )}

                    {/* Confidence pill */}
                    {b.confidence != null && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Confidence</span>
                            <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                    style={{ width: `${Math.round(b.confidence * 100)}%` }}
                                />
                            </div>
                            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {(b.confidence * 100).toFixed(0)}%
                            </span>
                        </div>
                    )}

                    {/* Citations */}
                    {b.citations && b.citations.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-semibold uppercase text-zinc-500 tracking-wider">
                                Citations ({b.citations.length})
                            </span>
                            <div className="space-y-2">
                                {b.citations.map((cite, ci) => (
                                    <div
                                        key={ci}
                                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-2.5 space-y-1"
                                    >
                                        <a
                                            href={cite.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:text-primary dark:hover:text-primary transition-colors group"
                                        >
                                            <span className="truncate">{cite.title || cite.url}</span>
                                            <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0 group-hover:text-primary transition-colors" />
                                        </a>
                                        {cite.excerpts && cite.excerpts.length > 0 && (
                                            <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                                                &ldquo;{cite.excerpts[0]}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default function PlaygroundRightPane({
    leftWidth,
    state,
    setters,
    handlers
}) {
    const {
        currentResult,
        isOutputCopied,
        outputFormat,
        normalizedCategory,
        isRunning,
        executionStep,
        activeCategoryMeta,
        isCodeModalOpen,
        prompt,
        mode,
        isStructuredOutput,
        schemaTemplate,
        responseFormat,
        includeTrace,
        location,
        language,
        alertThreshold,
        webhookUrl,
        pollingInterval,
        namespace,
        topK,
        similarityThreshold,
        extractRelations,
    } = state

    const { theme } = useTheme()

    const {
        setOutputFormat,
        setIsCodeModalOpen,
    } = setters

    const {
        handleCopyCurrentOutput,
    } = handlers

    // ── Derived helpers pulling from the new { run, output } envelope ──
    const run = currentResult?.run
    const output = currentResult?.output
    const durationMs = run?.execution?.executionTimeMs
    const durationLabel = durationMs != null ? `${(durationMs / 1000).toFixed(2)}s` : null
    const tokensLabel = run?.execution?.tokensUsed
    const costLabel = run?.execution?.costTotal

    return (
        <div
            style={{ width: `${100 - leftWidth}%` }}
            className="w-full lg:w-auto flex-1 h-full bg-[#FAF8F5] dark:bg-zinc-950 px-5 sm:px-6 py-3.5 flex flex-col justify-between relative overflow-hidden min-h-0"
        >
            {/* Top Bar of Results Pane */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/80 gap-3 shrink-0">
                {/* Left Actions: Telemetry / Copy / Status */}
                <div className="flex items-center gap-2">
                    {currentResult && (
                        <>
                            {/* Telemetry pill */}
                            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                                {durationLabel && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{durationLabel}</span>
                                )}
                                {durationLabel && tokensLabel && <span>•</span>}
                                {tokensLabel != null && (
                                    <span>{tokensLabel.toLocaleString()} tok</span>
                                )}
                                {tokensLabel && costLabel && <span>•</span>}
                                {costLabel != null && (
                                    <span className="text-zinc-700 dark:text-zinc-300">${Number(costLabel).toFixed(4)}</span>
                                )}
                            </div>

                            {/* Copy Output Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyCurrentOutput}
                                className="rounded h-7 px-2.5 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono gap-1 cursor-pointer shadow-xs"
                            >
                                {isOutputCopied ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                {isOutputCopied ? 'Copied' : 'Copy'}
                            </Button>
                        </>
                    )}
                </div>

                {/* Format Option Toggle: Markdown | JSON | Trace */}
                <div className="flex items-center gap-1 p-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    {[
                        { id: 'markdown', label: normalizedCategory === 'monitor' ? 'Stream' : normalizedCategory === 'memory' ? 'Entities' : 'Markdown', icon: normalizedCategory === 'monitor' ? Radio : normalizedCategory === 'memory' ? Network : FileText },
                        { id: 'json', label: 'JSON', icon: Code2 },
                        { id: 'trace', label: 'Trace', icon: Layers },
                    ].map((fmt) => {
                        const Icon = fmt.icon
                        const isSelected = outputFormat === fmt.id
                        return (
                            <button
                                key={fmt.id}
                                type="button"
                                onClick={() => setOutputFormat(fmt.id)}
                                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700/60 font-semibold'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                    }`}
                            >
                                <Icon className={`h-3 w-3 ${isSelected ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500'}`} />
                                <span>{fmt.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Center Canvas Area: Empty State, Running State, or Rendered Result */}
            <div className="flex-1 overflow-y-auto py-4 min-h-0">
                {isRunning ? (
                    /* Running / Pipeline Progress */
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                        <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                            <RotateCw className="h-7 w-7 text-primary animate-spin" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                Executing {activeCategoryMeta.label}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono animate-pulse">
                                {executionStep}
                            </p>
                        </div>
                    </div>
                ) : currentResult ? (
                    /* Completed Result View */
                    <div className="space-y-4 w-full pb-16 px-2">
                        {/* View: Primary Markdown / Stream / Entities */}
                        {outputFormat === 'markdown' && (
                            <div className="space-y-5">
                                <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed font-sans text-zinc-800 dark:text-zinc-200 prose-pre:bg-zinc-100 prose-pre:text-zinc-900 dark:prose-pre:bg-zinc-900 dark:prose-pre:text-zinc-100 prose-p:leading-relaxed prose-a:text-primary">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            table: ({node, ...props}) => <div className="overflow-x-auto my-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"><table className="w-full text-sm text-left border-collapse" {...props} /></div>,
                                            thead: ({node, ...props}) => <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100" {...props} />,
                                            th: ({node, ...props}) => <th className="px-5 py-4 font-semibold" {...props} />,
                                            td: ({node, ...props}) => <td className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#0a0a0a]" {...props} />,
                                            tr: ({node, ...props}) => <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors" {...props} />,
                                            h1: ({node, ...props}) => <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-10 mb-6 tracking-tight leading-tight" {...props} />,
                                            h2: ({node, ...props}) => <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mt-8 mb-5 tracking-tight" {...props} />,
                                            h3: ({node, ...props}) => <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white mt-6 mb-4 tracking-tight" {...props} />
                                        }}
                                    >
                                        {output?.content || ''}
                                    </ReactMarkdown>
                                </div>

                                {/* Monitor Specific: Live Event Stream Rows */}
                                {output?.events && (
                                    <div className="pt-2 space-y-2">
                                        <span className="text-[11px] font-mono font-semibold uppercase text-zinc-500 tracking-wider">
                                            Live Stream Ingest ({output.events.length} Events)
                                        </span>
                                        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-xs font-mono text-xs">
                                            {output.events.map((evt, i) => (
                                                <div key={i} className="p-2.5 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                                            {evt.status}
                                                        </Badge>
                                                        <span className="text-zinc-800 dark:text-zinc-200">{evt.note}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
                                                        <span className="text-emerald-600 dark:text-emerald-400">{evt.latency}</span>
                                                        <span>{evt.time}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Memory Specific: Extracted Entities & Graph */}
                                {output?.entities && (
                                    <div className="pt-2 space-y-2">
                                        <span className="text-[11px] font-mono font-semibold uppercase text-zinc-500 tracking-wider">
                                            Matched Entity Nodes ({output.entities.length})
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {output.entities.map((ent, i) => (
                                                <div
                                                    key={i}
                                                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs space-y-1.5"
                                                >
                                                    <div className="flex items-center justify-between text-xs">
                                                        <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
                                                            {ent.type}
                                                        </Badge>
                                                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            {(ent.score * 100).toFixed(1)}% match
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{ent.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── Agent Reasoning Trace (Basis) — Task only, when includeTrace ── */}
                                {output?.basis && output.basis.length > 0 && (
                                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                        <BasisBlock basis={output.basis} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* View: Raw JSON */}
                        {outputFormat === 'json' && (
                                <div className="rounded-xl border bg-[#1e1e1e]  dark:border-zinc-800 font-mono text-xs overflow-auto shadow-inner h-[80vh] w-full p-4">
                                <ReactJson 
                                    src={currentResult}
                                    theme="monokai"
                                    iconStyle="triangle"
                                    collapsed={false}
                                    shouldCollapse={(field) => {
                                       return field.name === 'execution'
                                    }}
                                    enableClipboard={false}
                                    displayDataTypes={false}
                                        displayObjectSize={true}
                                    style={{backgroundColor:'transparent'}}
                                />
                            </div>
                        )}

                        {/* View: Execution Trace */}
                        {outputFormat === 'trace' && (
                            <div className="space-y-3">
                                {/* Run summary row */}
                                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                                        Duration: <strong className="text-zinc-900 dark:text-zinc-100">{durationLabel ?? '—'}</strong>
                                    </span>
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                                        Workers: <strong className="text-zinc-900 dark:text-zinc-100">{run?.metadata?.workerCount ?? '—'}</strong>
                                    </span>
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                                        Format: <strong className="text-zinc-900 dark:text-zinc-100">{run?.metadata?.responseFormat ?? '—'}</strong>
                                    </span>
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                                        Trace: <strong className={run?.metadata?.includeTrace ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}>{run?.metadata?.includeTrace ? 'enabled' : 'disabled'}</strong>
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { step: '1. Intent & Spec Decomposition', duration: '140ms', status: 'done' },
                                        { step: '2. Multi-Agent Vector & Stream Ingestion', duration: '980ms', status: 'done' },
                                        { step: '3. Verification & Cross-Source Deduplication', duration: '410ms', status: 'done' },
                                        { step: '4. Final Synthesis & Schema Alignment', duration: '520ms', status: 'done' },
                                    ].map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs font-mono shadow-xs"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                <span className="text-zinc-800 dark:text-zinc-200">{item.step}</span>
                                            </div>
                                            <span className="text-zinc-500 text-[11px]">{item.duration}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Show reasoning trace inline in Trace tab as well */}
                                {output?.basis && output.basis.length > 0 && (
                                    <div className="pt-2">
                                        <BasisBlock basis={output.basis} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 dark:text-zinc-500 shadow-inner">
                            <Search className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                                No {activeCategoryMeta.label} results yet
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Enter a query or select an example and hit Run to see results.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating "Get Code" Button */}
            <div className="absolute bottom-5 right-5 z-10">
                <Button
                    onClick={() => setIsCodeModalOpen((v) => !v)}
                    className="rounded px-4 py-2 text-xs font-mono font-semibold bg-primary text-white border border-zinc-700 dark:border-zinc-200 shadow-xl cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105"
                >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>{isCodeModalOpen ? 'Hide Code' : 'Get Code'}</span>
                </Button>
            </div>

            {/* Floating Code Panel — bottom-right, no overlay */}
            {isCodeModalOpen &&
                <CodeDialog
                    prompt={prompt}
                    activeCategoryMeta={activeCategoryMeta}
                    normalizedCategory={normalizedCategory}
                    mode={mode}
                    isStructuredOutput={isStructuredOutput}
                    schemaTemplate={schemaTemplate}
                    responseFormat={responseFormat}
                    includeTrace={includeTrace}
                    location={location}
                    language={language}
                    alertThreshold={alertThreshold}
                    webhookUrl={webhookUrl}
                    pollingInterval={pollingInterval}
                    namespace={namespace}
                    topK={topK}
                    similarityThreshold={similarityThreshold}
                    extractRelations={extractRelations}
                    setIsCodeModalOpen={setIsCodeModalOpen}
                />
            }
        </div>
    )
}
