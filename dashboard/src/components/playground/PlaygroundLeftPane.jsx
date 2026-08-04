import React from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { ExternalLink, ChevronDown, Play, RotateCw, Calendar, Link2, GitFork, Network, Workflow, GitPullRequest, Check, Zap } from 'lucide-react'

export default function PlaygroundLeftPane({
    leftWidth,
    state,
    setters,
    handlers
}) {
    const {
        activeCategoryMeta,
        normalizedCategory,
        prompt,
        mode,
        isStructuredOutput,
        schemaTemplate,
        responseFormat,
        includeTrace,
        location,
        language,
        dateRange,
        alertThreshold,
        webhookUrl,
        pollingInterval,
        namespace,
        topK,
        similarityThreshold,
        extractRelations,
        isRunning,
    } = state

    const {
        setPrompt,
        setMode,
        setIsStructuredOutput,
        setSchemaTemplate,
        setResponseFormat,
        setIncludeTrace,
        setLocation,
        setLanguage,
        setDateRange,
        setAlertThreshold,
        setWebhookUrl,
        setPollingInterval,
        setNamespace,
        setTopK,
        setSimilarityThreshold,
        setExtractRelations,
    } = setters

    const { handleKeyDown, handleRunTask } = handlers

    const MODELS = [
        { id: 'FAST', label: 'Fast', desc: 'Lightweight and faster (1 worker)', time: '10s - 20s', icon: Link2 },
        { id: 'STANDARD', label: 'Standard', desc: 'Efficient for standard tasks (4 workers)', time: '15s - 50s', icon: GitFork },
        { id: 'DEEP', label: 'Deep', desc: 'Balanced and strong at many tasks (6 DAGs)', time: '15s - 2min', icon: Network },
    ]
    const activeModel = MODELS.find(m => m.id === mode) || MODELS[0]

    return (
        <div
            style={{ width: `${leftWidth}%` }}
            className="w-full lg:w-auto h-full flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800/80 bg-[#FAF8F5] dark:bg-zinc-950 shrink-0 overflow-y-auto space-y-5 p-5 sm:p-6"
        >
            <div className="space-y-5">
                {/* Header: API Title, Badge, Docs Button, Subtitle */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                {activeCategoryMeta.label}
                            </h1>
                            <Badge variant="outline" className="font-mono text-[10px] uppercase text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800">
                                {activeCategoryMeta.badge}
                            </Badge>
                        </div>

                        <Link
                            to="https://docs.sequential.ai"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
                        >
                            Docs <ExternalLink className="h-3 w-3 text-zinc-400" />
                        </Link>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {activeCategoryMeta.subtitle}
                    </p>
                </div>

                {/* Query Input Card */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1">
                        {normalizedCategory === 'task' && 'Task Query & Spec'}
                        {normalizedCategory === 'monitor' && 'Target Stream / Endpoint'}
                        {normalizedCategory === 'memory' && 'Semantic Memory Query'}
                        <span className="text-red-500 font-bold">*</span>
                    </label>

                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-3 shadow-xs focus-within:border-primary/50 dark:focus-within:border-zinc-700 transition-all space-y-3">
                        <Textarea
                            placeholder={
                                normalizedCategory === 'task'
                                    ? 'Ask any question, summary, extraction, or research topic...'
                                    : normalizedCategory === 'monitor'
                                        ? 'Enter endpoint URL or telemetry stream spec to monitor...'
                                        : 'Enter semantic query or entity retrieval criteria...'
                            }
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={8}
                            className="min-h-[150px] resize-none border-0 p-1.5 text-xs font-sans bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none leading-relaxed"
                        />

                        {/* Bottom row inside Query box: Examples dropdown & Run Button */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                            {/* Model Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-50 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-[#1A1A1A]  transition-colors cursor-pointer border border-zinc-400 dark:border-zinc-700/80 "
                                    >
                                        <activeModel.icon className="h-4 w-4 text-foreground dark:text-white" strokeWidth={1.5} />
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-foreground dark:text-white tracking-wide">{activeModel.label}</span>
                                           
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-foreground dark:text-white ml-1 opacity-80" strokeWidth={2.5} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="w-[320px] bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-2xl"
                                >
                                    <DropdownMenuGroup>
                                        {MODELS.map((item) => (
                                            <DropdownMenuItem
                                                key={item.id}
                                                onClick={() => setMode(item.id)}
                                                className={`group flex items-start justify-between p-3 cursor-pointer rounded-lg transition-colors ${
                                                    mode === item.id 
                                                        ? 'bg-zinc-100 dark:bg-zinc-900/50' 
                                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/80'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Left Icon */}
                                                    <div className={`mt-0.5 transition-colors ${mode === item.id ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300'}`}>
                                                        <item.icon className="h-5 w-5 stroke-[1.5]" />
                                                    </div>
                                                    {/* Text content */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">{item.label}</span>
                                                            <div className="flex flex-col gap-[2px] opacity-60">
                                                                <div className="h-[2px] w-3 bg-zinc-500 rounded-full" />
                                                                <div className="h-[2px] w-2 bg-zinc-500 rounded-full" />
                                                            </div>
                                                        </div>
                                                        <span className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">{item.desc}</span>
                                                        <span className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-0.5">{item.time}</span>
                                                    </div>
                                                </div>
                                                {/* Right Checkmark */}
                                                {mode === item.id && (
                                                    <Check className="h-4 w-4 text-emerald-500 mt-1" />
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* ▶ Run Button */}
                            <Button
                                size="sm"
                                disabled={!prompt.trim() || isRunning}
                                onClick={handleRunTask}
                                className="rounded h-7 px-3.5 text-xs font-bold uppercase text-white shadow-xs cursor-pointer flex items-center gap-1.5 font-mono transition-all hover:scale-102 active:scale-98 bg-primary hover:bg-primary/90"
                            >
                                {isRunning ? (
                                    <>
                                        <RotateCw className="h-3 w-3 animate-spin" />
                                        <span>Running</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-3 w-3 fill-current" />
                                        <span>Run {activeCategoryMeta.label.split(' ')[0]}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ===================================================
                    CATEGORY-SPECIFIC CONTROLS & FILTERS
                =================================================== */}

                {normalizedCategory === 'task' && (
                    /* Task Controls */
                    <div className="space-y-3 pt-1">

                        {/* Response Format Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Response Format</label>
                            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                {[
                                    { id: 'markdown', label: 'Markdown', hint: 'Rich text' },
                                    { id: 'json', label: 'JSON', hint: 'Structured' },
                                ].map((fmt) => (
                                    <button
                                        key={fmt.id}
                                        type="button"
                                        onClick={() => setResponseFormat(fmt.id)}
                                        className={`flex flex-col items-center py-1.5 px-2 rounded-lg text-[10px] font-mono font-semibold uppercase transition-all cursor-pointer text-center ${
                                            responseFormat === fmt.id
                                                ? 'bg-white dark:bg-zinc-800 text-primary shadow-xs border border-zinc-200 dark:border-zinc-700/60'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                        }`}
                                    >
                                        <span>{fmt.label}</span>
                                        <span className={`text-[9px] font-normal normal-case mt-0.5 ${
                                            responseFormat === fmt.id ? 'text-primary/70' : 'text-zinc-400'
                                        }`}>{fmt.hint}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
                                The LLM generates only <strong className="text-zinc-600 dark:text-zinc-400">{responseFormat}</strong> — no double generation, no wasted tokens.
                            </p>
                        </div>

                        {/* JSON Schema Template (only when format = json) */}
                        {responseFormat === 'json' && (
                            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                                    <span>TaskSpec Schema</span>
                                    <span className="text-zinc-400 dark:text-zinc-500">JSON</span>
                                </div>
                                <Textarea
                                    value={schemaTemplate}
                                    onChange={(e) => setSchemaTemplate(e.target.value)}
                                    rows={3}
                                    className="font-mono text-[11px] rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 text-zinc-800 dark:text-zinc-200 resize-none focus-visible:ring-0"
                                />
                            </div>
                        )}

                        {/* Include Trace Toggle */}
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 space-y-1">
                            <label className="flex items-center justify-between cursor-pointer select-none text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white">
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-mono text-xs">Include Reasoning Trace</span>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                                        {includeTrace ? 'Returns basis, citations & confidence' : 'Omit trace — smaller payload'}
                                    </span>
                                </div>
                                <Switch
                                    checked={includeTrace}
                                    onCheckedChange={setIncludeTrace}
                                    className="scale-90 shrink-0"
                                />
                            </label>
                        </div>
                    </div>
                )}

                {normalizedCategory === 'monitor' && (
                    /* Monitor Controls */
                    <div className="space-y-3 pt-1">
                        {/* Stream Mode Selector */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Stream Ingestion Mode</label>
                            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                {[
                                    { id: 'REALTIME', label: 'REALTIME', desc: '50ms' },
                                    { id: 'CONTINUOUS', label: 'CONTINUOUS', desc: '1s poll' },
                                    { id: 'CRON', label: 'SCHEDULED', desc: 'Hourly' },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setMode(item.id)}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-semibold uppercase transition-all cursor-pointer text-center ${mode === item.id
                                            ? 'bg-white dark:bg-zinc-800 text-primary shadow-xs border border-zinc-200 dark:border-zinc-700/60 font-bold'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Alert Threshold & Polling Interval */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Anomaly Threshold</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left shadow-xs"
                                        >
                                            <span className="truncate font-mono">{alertThreshold}</span>
                                            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl p-1 shadow-xl">
                                        {['p99 > 250ms', 'Error Rate > 1.0%', '5xx Spikes (Instant)', 'Anomaly Sigma > 3'].map((item) => (
                                            <DropdownMenuItem
                                                key={item}
                                                onClick={() => setAlertThreshold(item)}
                                                className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer font-mono"
                                            >
                                                {item}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Probe Frequency</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left shadow-xs"
                                        >
                                            <span className="truncate">{pollingInterval}</span>
                                            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-48 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl p-1 shadow-xl">
                                        {['10 seconds', '30 seconds', '1 minute', '5 minutes'].map((item) => (
                                            <DropdownMenuItem
                                                key={item}
                                                onClick={() => setPollingInterval(item)}
                                                className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                                            >
                                                {item}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Webhook Dispatch Target */}
                        <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Webhook Dispatch Target</label>
                            <Input
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder="https://api.yourdomain.com/webhooks/alerts"
                                className="h-8 text-xs font-mono rounded-xl bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                            />
                        </div>
                    </div>
                )}

                {normalizedCategory === 'memory' && (
                    /* Memory Controls */
                    <div className="space-y-3 pt-1">
                        {/* Retrieval Engine Mode */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Context Retrieval Engine</label>
                            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                {[
                                    { id: 'GRAPH_RAG', label: 'GRAPH RAG', desc: 'Entity graph' },
                                    { id: 'HYBRID', label: 'HYBRID', desc: 'Dense + BM25' },
                                    { id: 'VECTOR_COSINE', label: 'VECTOR', desc: 'Cosine' },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setMode(item.id)}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-semibold uppercase transition-all cursor-pointer text-center ${mode === item.id
                                            ? 'bg-white dark:bg-zinc-800 text-primary shadow-xs border border-zinc-200 dark:border-zinc-700/60 font-bold'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Namespace & Top-K Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Collection Namespace</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left shadow-xs"
                                        >
                                            <span className="truncate font-mono">{namespace}</span>
                                            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl p-1 shadow-xl">
                                        {['prod-agents', 'user-context', 'knowledge-base', 'system-logs'].map((item) => (
                                            <DropdownMenuItem
                                                key={item}
                                                onClick={() => setNamespace(item)}
                                                className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer font-mono"
                                            >
                                                {item}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Top-K Density</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left shadow-xs"
                                        >
                                            <span className="truncate">{topK}</span>
                                            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-44 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl p-1 shadow-xl">
                                        {['Top 5', 'Top 10', 'Top 25', 'Top 50'].map((item) => (
                                            <DropdownMenuItem
                                                key={item}
                                                onClick={() => setTopK(item)}
                                                className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                                            >
                                                {item}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Similarity Threshold & Graph Triples */}
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 space-y-2">
                            <label className="flex items-center justify-between cursor-pointer select-none text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white">
                                <span className="font-mono text-xs">Extract Entity Relations & Graph</span>
                                <Switch
                                    checked={extractRelations}
                                    onCheckedChange={setExtractRelations}
                                    className="scale-90"
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Helper text */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 text-[11px] text-zinc-500 leading-relaxed">
                {normalizedCategory === 'task' && 'Autonomous DAG orchestration with live multi-worker reasoning.'}
                {normalizedCategory === 'monitor' && 'High-frequency telemetry probe with sub-50ms anomaly detection.'}
                {normalizedCategory === 'memory' && 'Multi-modal vector knowledge graph persistence.'}{' '}
                <a
                    href="https://docs.sequential.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-600 dark:text-zinc-400 underline hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                    Read spec docs ↗
                </a>
            </div>
        </div>
    )
}
