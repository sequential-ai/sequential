import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Copy, Radio, Network, FileText, Code2, Layers, RotateCw, Search, CheckCircle2, ExternalLink } from 'lucide-react'
import CodeDialog from '@/components/CodeDialog'

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

    const {
        setOutputFormat,
        setIsCodeModalOpen,
    } = setters

    const {
        handleCopyCurrentOutput,
    } = handlers

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
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{currentResult.duration}</span>
                                <span>•</span>
                                <span>{currentResult.tokens.toLocaleString()} tok</span>
                                <span>•</span>
                                <span className="text-zinc-700 dark:text-zinc-300">${currentResult.cost.toFixed(4)}</span>
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
                    <div className="space-y-4 max-w-3xl pb-16">
                        {/* View: Primary Markdown / Stream / Entities */}
                        {outputFormat === 'markdown' && (
                            <div className="space-y-4">
                                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-3 font-sans text-zinc-800 dark:text-zinc-200">
                                    {currentResult.output.answer.split('\n\n').map((para, i) => {
                                        if (para.startsWith('### ')) {
                                            return (
                                                <h3 key={i} className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 pt-2 pb-1 border-b border-zinc-200 dark:border-zinc-800/80">
                                                    {para.replace('### ', '')}
                                                </h3>
                                            )
                                        }
                                        if (para.startsWith('1. ') || para.startsWith('2. ') || para.startsWith('3. ') || para.startsWith('- ')) {
                                            return (
                                                <div key={i} className="flex items-start gap-2 pl-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                                    <p className="text-xs sm:text-sm leading-relaxed">{para.replace(/^[0-9]\.\s*|-\s*/, '')}</p>
                                                </div>
                                            )
                                        }
                                        return <p key={i} className="text-xs sm:text-sm leading-relaxed">{para}</p>
                                    })}
                                </div>

                                {/* Monitor Specific: Live Event Stream Rows */}
                                {currentResult.output.events && (
                                    <div className="pt-2 space-y-2">
                                        <span className="text-[11px] font-mono font-semibold uppercase text-zinc-500 tracking-wider">
                                            Live Stream Ingest ({currentResult.output.events.length} Events)
                                        </span>
                                        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-xs font-mono text-xs">
                                            {currentResult.output.events.map((evt, i) => (
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
                                {currentResult.output.entities && (
                                    <div className="pt-2 space-y-2">
                                        <span className="text-[11px] font-mono font-semibold uppercase text-zinc-500 tracking-wider">
                                            Matched Entity Nodes ({currentResult.output.entities.length})
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {currentResult.output.entities.map((ent, i) => (
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

                                {/* Task Specific: Structured Object validation card */}
                                {currentResult.output.structuredData && (
                                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-zinc-900 dark:text-zinc-200">Structured Data Payload</span>
                                            <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                                Score: {(currentResult.output.structuredData.confidenceScore * 100).toFixed(0)}%
                                            </Badge>
                                        </div>
                                        <pre className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 font-mono text-[11px] text-zinc-800 dark:text-zinc-300 overflow-x-auto border border-zinc-200 dark:border-zinc-800">
                                            <code>{JSON.stringify(currentResult.output.structuredData, null, 2)}</code>
                                        </pre>
                                    </div>
                                )}

                                {/* Verified Sources / Citations */}
                                {currentResult.output.sources && currentResult.output.sources.length > 0 && (
                                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                                        <span className="text-[11px] font-mono font-semibold uppercase text-zinc-500 tracking-wider">
                                            Verified Citations ({currentResult.output.sources.length})
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {currentResult.output.sources.map((src, i) => (
                                                <a
                                                    key={i}
                                                    href={src.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 group shadow-xs"
                                                >
                                                    <span className="truncate pr-2 font-medium group-hover:text-primary transition-colors">
                                                        {src.title}
                                                    </span>
                                                    <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* View: Raw JSON */}
                        {outputFormat === 'json' && (
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-4 font-mono text-xs overflow-x-auto shadow-inner">
                                <pre className="text-zinc-800 dark:text-zinc-300">
                                    <code>{JSON.stringify(currentResult, null, 2)}</code>
                                </pre>
                            </div>
                        )}

                        {/* View: Execution Trace */}
                        {outputFormat === 'trace' && (
                            <div className="space-y-3">
                                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs">
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">Total Duration: <strong className="text-zinc-900 dark:text-zinc-100">{currentResult.duration}</strong></span>
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">Parallel Workers: <strong className="text-zinc-900 dark:text-zinc-100">{currentResult.workerCount}</strong></span>
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
