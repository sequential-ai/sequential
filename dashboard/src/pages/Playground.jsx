import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
    ChevronDown,
    Info,
    GripVertical,
    Calendar,
    MapPin,
    Languages,
    SlidersHorizontal,
    FileText,
    Maximize2,
    RefreshCw,
    Bot,
    Compass,
    ArrowUpRight,
    Sun,
    Moon,
    ListTodo,
    Crosshair,
    Grid2X2,
    Activity,
    Radio,
    HardDrive,
    Network,
    TrendingUp,
    AlertCircle,
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useTheme } from '@/context/ThemeContext'

const API_CATEGORIES = [
    {
        id: 'task',
        label: 'Task API',
        icon: ListTodo,
        badge: 'v1.tasks',
        subtitle: 'Autonomous reasoning DAGs, multi-agent workflows & structured synthesis',
        defaultPrompt: 'Analyze recent trends in enterprise agentic AI architectures in 2026',
        prompts: [
            'best headless browser frameworks 2026',
            'Analyze recent trends in enterprise agentic AI architectures in 2026',
            'Compare token efficiency and latency across Claude 3.7 Sonnet vs OpenAI o3-mini',
            'Synthesize cross-border regulatory compliance guidelines for FinTech AI deployment',
            'Extract structured security vulnerabilities from API specs',
        ],
    },
    {
        id: 'monitor',
        label: 'Monitor',
        icon: Crosshair,
        badge: 'v1.monitors',
        subtitle: 'Real-time query synthesis, live event monitoring, latency metrics & error stream analysis',
        defaultPrompt: 'https://api.sequential.ai/v1/health - Track latency anomaly spikes & SLA breach',
        prompts: [
            'https://api.sequential.ai/v1/health - Track latency anomaly spikes & SLA breach',
            'Monitor Postgres connection pool saturation & webhook retry timeouts',
            'Audit cross-region LLM worker throughput & rate limit errors (429s)',
            'Track SEC 8-K filings live stream for AI semiconductor companies',
            'Detect synthetic data distribution drift in multi-agent memory store',
        ],
    },
    {
        id: 'memory',
        label: 'Memory',
        icon: Grid2X2,
        badge: 'v1.memory',
        subtitle: 'Persistent contextual knowledge graphs, multi-modal vector search & structured entity extraction',
        defaultPrompt: 'Retrieve user preferences, active project sessions and auth tokens for org_98a72',
        prompts: [
            'Retrieve user preferences, active project sessions and auth tokens for org_98a72',
            'Query cross-session reasoning graph for enterprise compliance constraints',
            'Extract semantic entities and relationships from uploaded system architecture spec',
            'Fetch semantic memory clusters related to distributed cache invalidation',
            'Search vector memory store for high-confidence historical bug resolutions',
        ],
    },
]

const INITIAL_HISTORY = [
    {
        id: 'tsk_9f83a1b2',
        category: 'task',
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
            structuredData: {
                title: 'Enterprise Agentic AI Architecture Trends',
                confidenceScore: 0.98,
                keyFindings: [
                    'Deterministic DAG isolation cuts error rates by 78%',
                    'Hybrid routing reduces inference cost by 40%',
                    'Zero-latency memory graphs enable cross-session context retention',
                ],
            },
            sources: [
                { title: 'State of Multi-Agent Systems 2026', url: 'https://arxiv.org/abs/2603.1892' },
                { title: 'Enterprise AI Infrastructure Report', url: 'https://research.sequential.ai/infra-2026' },
            ],
        },
    },
    {
        id: 'mon_8819d4e2',
        category: 'monitor',
        query: 'https://api.sequential.ai/v1/health - Track latency anomaly spikes & SLA breach',
        status: 'ACTIVE',
        mode: 'REALTIME',
        workerCount: 4,
        citationCount: 0,
        duration: '0.04s',
        tokens: 1240,
        cost: 0.0012,
        createdAt: '15 mins ago',
        output: {
            answer: `### Live Stream Monitor: Health Probe\n\nEndpoint **https://api.sequential.ai/v1/health** is operating within normal SLA thresholds.\n\n- **P95 Latency**: 38ms\n- **P99 Latency**: 54ms\n- **Error Rate**: 0.00%\n- **Uptime**: 99.99%`,
            events: [
                { time: '14:22:01.402', status: '200 OK', latency: '34ms', note: 'Worker node us-east-1a healthy' },
                { time: '14:22:01.350', status: '200 OK', latency: '41ms', note: 'Database pool latency nominal' },
                { time: '14:22:01.300', status: '200 OK', latency: '38ms', note: 'Heartbeat ping ACK' },
            ],
        },
    },
    {
        id: 'mem_33a01b7c',
        category: 'memory',
        query: 'Retrieve user preferences, active project sessions and auth tokens for org_98a72',
        status: 'COMPLETED',
        mode: 'GRAPH_RAG',
        workerCount: 2,
        citationCount: 4,
        duration: '1.2s',
        tokens: 8900,
        cost: 0.0089,
        createdAt: '30 mins ago',
        output: {
            answer: `### Context Graph Retrieval\n\nSuccessfully retrieved semantic entities and relationship graph for **org_98a72** across vector namespace \`prod-agents\`.\n\n- **Matched Entities**: 8 node entities\n- **Graph Depth**: 2-hop relational traverse\n- **Average Similarity**: 0.942`,
            entities: [
                { name: 'Organization: Sequential Enterprise', score: 0.984, type: 'Entity' },
                { name: 'ActiveSession: sess_90184b (Agent Reasoning)', score: 0.961, type: 'Session' },
                { name: 'TokenPolicy: role:read_write_admin', score: 0.923, type: 'Policy' },
            ],
        },
    },
    {
        id: 'tsk_7e62c4d8',
        category: 'task',
        query: 'Synthesize cross-border regulatory compliance guidelines for FinTech AI deployment',
        status: 'COMPLETED',
        mode: 'STANDARD',
        workerCount: 4,
        citationCount: 9,
        duration: '1.8s',
        tokens: 18400,
        cost: 0.0184,
        createdAt: '45 mins ago',
        output: {
            answer: `### Regulatory Framework Overview\n\nFinTech deployments in EU and US jurisdictions require mandatory audit tracing on automated decisions, structured liability contracts, and model explainability metrics.`,
            sources: [
                { title: 'EU AI Act Tier 2 Compliance', url: 'https://compliance.eu/ai-act' },
            ],
        },
    },
]

// Custom High-Quality Syntax Highlighter
function SyntaxHighlightedCode({ code, language }) {
    const lines = code.split('\n')

    return (
        <div className="font-mono text-[12px] leading-relaxed select-text">
            {lines.map((line, lineIdx) => {
                if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
                    return (
                        <div key={lineIdx} className="table-row">
                            <span className="table-cell select-none text-right pr-4 text-zinc-600 font-mono text-[11px]">
                                {lineIdx + 1}
                            </span>
                            <span className="table-cell font-mono text-zinc-500 italic whitespace-pre">
                                {line}
                            </span>
                        </div>
                    )
                }

                const tokenRegex =
                    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|#[^\n]*|\/\/[^\n]*|\$[A-Z0-9_]+|--[a-z0-9-]+|-[a-zA-Z]|(?:import|from|const|let|var|async|await|function|return|def|print|as|class|try|except|new)\b|\b(?:\d+(?:\.\d+)?)\b|[a-zA-Z_][a-zA-Z0-9_]*(?=\()|[a-zA-Z_][a-zA-Z0-9_]*(?=:)|[{}\[\](),:;=+\-*\/\\&|<>!]+|[a-zA-Z0-9_.-]+|\s+)/g

                const parts = []
                let match

                while ((match = tokenRegex.exec(line)) !== null) {
                    const text = match[0]
                    let colorClass = 'text-zinc-200'

                    if (text.startsWith('"') || text.startsWith("'") || text.startsWith('`')) {
                        colorClass = 'text-emerald-400 dark:text-emerald-300'
                    } else if (text.startsWith('#') || text.startsWith('//')) {
                        colorClass = 'text-zinc-500 italic'
                    } else if (text.startsWith('$')) {
                        colorClass = 'text-purple-400 font-semibold'
                    } else if (text.startsWith('--') || text.startsWith('-')) {
                        colorClass = 'text-sky-400 font-medium'
                    } else if (
                        [
                            'import',
                            'from',
                            'const',
                            'let',
                            'var',
                            'async',
                            'await',
                            'function',
                            'return',
                            'def',
                            'print',
                            'as',
                            'class',
                            'try',
                            'except',
                            'new',
                            'curl',
                            'seq',
                        ].includes(text)
                    ) {
                        colorClass = 'text-pink-400 font-semibold'
                    } else if (['POST', 'GET', 'PUT', 'DELETE', 'PATCH'].includes(text)) {
                        colorClass = 'text-amber-400 font-bold'
                    } else if (/^\d+(\.\d+)?$/.test(text)) {
                        colorClass = 'text-orange-400'
                    } else if (['SequentialAI', 'Client', 'sequential'].includes(text)) {
                        colorClass = 'text-cyan-300 font-bold'
                    } else if (['tasks', 'monitors', 'memory', 'create', 'query', 'stream', 'search', 'run', 'log'].includes(text)) {
                        colorClass = 'text-blue-400'
                    } else if (['{', '}', '[', ']', '(', ')', ',', ';', '\\', ':', '='].includes(text)) {
                        colorClass = 'text-zinc-400'
                    }

                    parts.push(
                        <span key={parts.length} className={colorClass}>
                            {text}
                        </span>
                    )
                }

                return (
                    <div key={lineIdx} className="table-row hover:bg-zinc-800/30 transition-colors">
                        <span className="table-cell select-none text-right pr-4 text-zinc-600 font-mono text-[11px]">
                            {lineIdx + 1}
                        </span>
                        <span className="table-cell whitespace-pre">
                            {parts.length > 0 ? parts : line}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

function PlaygroundFallback() {
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
                <div className="lg:col-span-5 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-[#FAF8F5] dark:bg-zinc-950 space-y-4">
                    <UiSkeleton className="h-5 w-32 rounded" />
                    <UiSkeleton className="h-28 w-full rounded-xl" />
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                            <UiSkeleton key={i} className="h-16 rounded-xl" />
                        ))}
                    </div>
                    <UiSkeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="lg:col-span-7 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-[#FAF8F5] dark:bg-zinc-950 space-y-4">
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

export default function Playground() {
    const { isSyncing } = useAuth()
    const { theme, toggle } = useTheme()
    const { tab } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // Normalize category: 'task' | 'monitor' | 'memory' (support 'tasks' alias)
    const normalizedCategory = (tab === 'tasks' || tab === 'task')
        ? 'task'
        : (tab === 'monitor' ? 'monitor' : (tab === 'memory' ? 'memory' : 'task'))

    const initialView = searchParams.get('tab') === 'history' ? 'history' : 'playground'
    const [activeView, setActiveView] = useState(initialView)

    const activeCategoryMeta = API_CATEGORIES.find((c) => c.id === normalizedCategory) || API_CATEGORIES[0]

    // Prompt & Input States
    const [prompt, setPrompt] = useState(activeCategoryMeta.defaultPrompt)
    const [mode, setMode] = useState('FAST') // Task: FAST | STANDARD | DEEP, Monitor: REALTIME | CONTINUOUS | CRON, Memory: VECTOR_COSINE | HYBRID | GRAPH_RAG
    const [isStructuredOutput, setIsStructuredOutput] = useState(false)
    const [schemaTemplate, setSchemaTemplate] = useState('{\n  "title": "string",\n  "keyFindings": ["string"],\n  "confidenceScore": 0.95\n}')

    // Task Filter Dropdown States
    const [location, setLocation] = useState('US — United States')
    const [language, setLanguage] = useState('en — English')
    const [dateRange, setDateRange] = useState('Any time')

    // Monitor Specific States
    const [alertThreshold, setAlertThreshold] = useState('p99 > 250ms')
    const [webhookUrl, setWebhookUrl] = useState('https://api.yourdomain.com/webhooks/alerts')
    const [pollingInterval, setPollingInterval] = useState('10 seconds')

    // Memory Specific States
    const [namespace, setNamespace] = useState('prod-agents')
    const [topK, setTopK] = useState('Top 10')
    const [similarityThreshold, setSimilarityThreshold] = useState('0.85')
    const [extractRelations, setExtractRelations] = useState(true)

    // Output Format Toggle: 'markdown' | 'json' | 'trace' (or 'stream' / 'graph' depending on tab)
    const [outputFormat, setOutputFormat] = useState('markdown')

    // Execution State
    const [isRunning, setIsRunning] = useState(false)
    const [currentResult, setCurrentResult] = useState(null)
    const [executionStep, setExecutionStep] = useState('')

    // Resizable Splitter State
    const [leftWidth, setLeftWidth] = useState(38)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef(null)

    // Code Dialog State
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState('python') // 'python' | 'node' | 'curl'
    const [isCopied, setIsCopied] = useState(false)
    const [isOutputCopied, setIsOutputCopied] = useState(false)

    // History State
    const [historyList, setHistoryList] = useState(INITIAL_HISTORY)
    const [historySearch, setHistorySearch] = useState('')

    // Sync prompt and mode when switching tabs
    useEffect(() => {
        const meta = API_CATEGORIES.find((c) => c.id === normalizedCategory) || API_CATEGORIES[0]
        setPrompt(meta.defaultPrompt)
        if (normalizedCategory === 'task') {
            setMode('FAST')
            setOutputFormat('markdown')
        } else if (normalizedCategory === 'monitor') {
            setMode('REALTIME')
            setOutputFormat('markdown')
        } else if (normalizedCategory === 'memory') {
            setMode('GRAPH_RAG')
            setOutputFormat('markdown')
        }
        setCurrentResult(null)
    }, [normalizedCategory])

    // Dragging logic for Resizable Split Pane
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const newWidth = ((e.clientX - rect.left) / rect.width) * 100
            if (newWidth >= 25 && newWidth <= 70) {
                setLeftWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false)
                document.body.style.cursor = 'default'
                document.body.style.userSelect = 'auto'
            }
        }

        if (isDragging) {
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    // Tab Navigation Switcher
    const handleCategorySelect = (categoryId) => {
        navigate(`/dashboard/playground/${categoryId}`)
    }

    // Run Execution handler based on active category
    const handleRunTask = () => {
        if (!prompt.trim() || isRunning) return

        setIsRunning(true)
        setCurrentResult(null)

        if (normalizedCategory === 'task') {
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
                    category: 'task',
                    query: prompt,
                    mode,
                    status: 'COMPLETED',
                    duration: mode === 'DEEP' ? '3.8s' : mode === 'STANDARD' ? '2.1s' : '0.9s',
                    tokens: mode === 'DEEP' ? 34200 : mode === 'STANDARD' ? 18600 : 7400,
                    cost: mode === 'DEEP' ? 0.0342 : mode === 'STANDARD' ? 0.0186 : 0.0074,
                    workerCount: mode === 'DEEP' ? 6 : mode === 'STANDARD' ? 4 : 2,
                    createdAt: 'Just now',
                    location,
                    language,
                    output: {
                        answer: `### Results for "${prompt}"\n\nSequential AI synthesized results across multiple verified sources for **${prompt}**.\n\n1. **Core Findings**: Headless browser ecosystems in 2026 are dominated by lightweight WebAssembly runtimes and distributed CDP orchestration clusters.\n2. **Optimization Metrics**: Autonomous multi-tab concurrency achieves **sub-120ms DOM extraction** with anti-bot bypass validation.\n3. **Recommended Integration**: Use the Sequential Browser Agent SDK to pipe DOM states directly into your extraction pipeline.`,
                        structuredData: isStructuredOutput
                            ? {
                                query: prompt,
                                title: prompt.slice(0, 45),
                                keyFindings: [
                                    'High confidence extraction completed with 0 errors',
                                    'Zero cascade hallucination detected across 12 source domains',
                                    'Latency within sub-second tier SLA',
                                ],
                                confidenceScore: 0.98,
                                extractedAt: new Date().toISOString(),
                            }
                            : null,
                        sources: [
                            { title: 'Sequential Headless Browser Spec (2026)', url: 'https://docs.sequential.ai/browser' },
                            { title: 'Global Browser Automation Benchmark', url: 'https://benchmarks.ai/browsers' },
                            { title: 'Enterprise Web Scraping Architecture', url: 'https://sequential.ai/docs/tasks' },
                        ],
                    },
                }

                setCurrentResult(generatedResult)
                setHistoryList([generatedResult, ...historyList])
                setIsRunning(false)
                setExecutionStep('')
            }, 2100)
        } else if (normalizedCategory === 'monitor') {
            setExecutionStep('Initiating telemetry stream listener...')
            setTimeout(() => {
                setExecutionStep('Evaluating p95/p99 anomaly threshold bounds...')
            }, 500)
            setTimeout(() => {
                setExecutionStep('Piping real-time event telemetry...')
            }, 1000)
            setTimeout(() => {
                const generatedResult = {
                    id: `mon_${Date.now().toString(36)}`,
                    category: 'monitor',
                    query: prompt,
                    mode,
                    status: 'ACTIVE',
                    duration: '0.04s',
                    tokens: 1420,
                    cost: 0.0014,
                    workerCount: 4,
                    createdAt: 'Just now',
                    output: {
                        answer: `### Active Stream Monitor: ${prompt}\n\nContinuous telemetry listener established. Verified **0 anomaly spikes** exceeding threshold \`${alertThreshold}\`.\n\n- **Target**: \`${prompt}\`\n- **Health Status**: 🟢 Healthy (SLA 99.99%)\n- **P95 Latency**: 36ms\n- **P99 Latency**: 48ms\n- **Webhook Dispatch**: \`${webhookUrl}\``,
                        events: [
                            { time: new Date().toLocaleTimeString() + '.892', status: '200 OK', latency: '32ms', note: 'Worker cluster ingress nominal' },
                            { time: new Date().toLocaleTimeString() + '.410', status: '200 OK', latency: '44ms', note: 'SSL handshake valid (TLS 1.3)' },
                            { time: new Date().toLocaleTimeString() + '.012', status: '200 OK', latency: '36ms', note: 'Database connection pool ACK' },
                            { time: new Date(Date.now() - 1000).toLocaleTimeString() + '.650', status: '200 OK', latency: '39ms', note: 'Telemetry packet received' },
                        ],
                    },
                }
                setCurrentResult(generatedResult)
                setHistoryList([generatedResult, ...historyList])
                setIsRunning(false)
                setExecutionStep('')
            }, 1600)
        } else if (normalizedCategory === 'memory') {
            setExecutionStep(`Querying vector space in namespace [${namespace}]...`)
            setTimeout(() => {
                setExecutionStep('Traversing knowledge graph entity nodes...')
            }, 600)
            setTimeout(() => {
                setExecutionStep('Computing cosine similarity & semantic rank...')
            }, 1200)
            setTimeout(() => {
                const generatedResult = {
                    id: `mem_${Date.now().toString(36)}`,
                    category: 'memory',
                    query: prompt,
                    mode,
                    status: 'COMPLETED',
                    duration: '1.1s',
                    tokens: 7200,
                    cost: 0.0072,
                    workerCount: 2,
                    createdAt: 'Just now',
                    output: {
                        answer: `### Memory Context Graph Retrieval\n\nRetrieved high-confidence semantic entities from collection \`${namespace}\` matching query **"${prompt}"** with threshold \`>= ${similarityThreshold}\`.\n\n1. **Semantic Density**: 12 entity clusters identified with 0 contradiction markers.\n2. **Graph Traversal**: Linked cross-session tokens to verified organization identity.\n3. **Context Injection**: Memory payload formatted for zero-latency prompt augmentation.`,
                        entities: [
                            { name: 'Entity: Sequential Enterprise Org Record', score: 0.982, type: 'Organization' },
                            { name: 'AgentSession: sess_77b912 (Active Orchestration)', score: 0.954, type: 'Session' },
                            { name: 'PolicyConfig: cross_border_compliance_v2', score: 0.918, type: 'Policy' },
                            { name: 'VectorNode: embedding_dim_1536_cosine', score: 0.895, type: 'Embedding' },
                        ],
                    },
                }
                setCurrentResult(generatedResult)
                setHistoryList([generatedResult, ...historyList])
                setIsRunning(false)
                setExecutionStep('')
            }, 1800)
        }
    }

    // Keyboard shortcut Ctrl+Enter / Cmd+Enter
    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            handleRunTask()
        }
    }

    // Copy Output
    const handleCopyCurrentOutput = () => {
        if (!currentResult) return
        const textToCopy =
            outputFormat === 'json'
                ? JSON.stringify(currentResult, null, 2)
                : currentResult.output.answer

        navigator.clipboard.writeText(textToCopy)
        setIsOutputCopied(true)
        setTimeout(() => setIsOutputCopied(false), 2000)
    }

    // Generate Code Snippets dynamically
    const getCodeSnippet = () => {
        const currentQuery = prompt || activeCategoryMeta.defaultPrompt

        if (normalizedCategory === 'task') {
            if (selectedLanguage === 'python') {
                return `import sequential

# Initialize Sequential Client
client = sequential.Client(api_key="sk_live_seq_...")

# Create & Run Task
task = client.tasks.create(
    query="${currentQuery}",
    mode="${mode}",${isStructuredOutput
                        ? `\n    task_spec={\n        "format": "json",\n        "schema": ${schemaTemplate}\n    },`
                        : ''
                    }
    location="${location.split(' ')[0]}",
    language="${language.split(' ')[0]}"
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
    location: "${location.split(' ')[0]}",
    language: "${language.split(' ')[0]}"
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
    "mode": "${mode}",
    "location": "${location.split(' ')[0]}",
    "language": "${language.split(' ')[0]}"${isStructuredOutput
                    ? `,\n    "taskSpec": { "format": "json" }`
                    : ''
                }
  }'`
        }

        if (normalizedCategory === 'monitor') {
            if (selectedLanguage === 'python') {
                return `import sequential

client = sequential.Client(api_key="sk_live_seq_...")

# Setup Live Stream Monitor
monitor = client.monitors.create(
    target="${currentQuery}",
    mode="${mode}",
    alert_threshold="${alertThreshold}",
    webhook_url="${webhookUrl}",
    interval="${pollingInterval}"
)

print(f"Monitor ID: {monitor.id} | Stream Status: {monitor.status}")
for event in monitor.stream():
    print(f"[{event.timestamp}] Status: {event.status_code} | Latency: {event.latency_ms}ms")`
            }

            if (selectedLanguage === 'node') {
                return `import { SequentialAI } from "@sequential-ai/sdk";

const client = new SequentialAI({
  apiKey: process.env.SEQUENTIAL_API_KEY,
});

async function run() {
  const monitor = await client.monitors.create({
    target: "${currentQuery}",
    mode: "${mode}",
    alertThreshold: "${alertThreshold}",
    webhookUrl: "${webhookUrl}",
    interval: "${pollingInterval}"
  });

  console.log("Monitor Live:", monitor.id);
  monitor.on("event", (evt) => console.log("Stream Event:", evt));
}

run();`
            }

            return `curl -X POST https://api.sequential.ai/v1/monitors \\
  -H "Authorization: Bearer sk_live_seq_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "target": "${currentQuery}",
    "mode": "${mode}",
    "alertThreshold": "${alertThreshold}",
    "webhookUrl": "${webhookUrl}"
  }'`
        }

        // Memory Category
        if (selectedLanguage === 'python') {
            return `import sequential

client = sequential.Client(api_key="sk_live_seq_...")

# Query Knowledge Graph & Vector Memory
memory_result = client.memory.query(
    query="${currentQuery}",
    namespace="${namespace}",
    mode="${mode}",
    top_k=${topK.replace('Top ', '')},
    threshold=${similarityThreshold},
    include_relations=${extractRelations ? 'True' : 'False'}
)

print(f"Retrieved {len(memory_result.entities)} entities:")
for entity in memory_result.entities:
    print(f"- {entity.name} (Similarity: {entity.score})")`
        }

        if (selectedLanguage === 'node') {
            return `import { SequentialAI } from "@sequential-ai/sdk";

const client = new SequentialAI({
  apiKey: process.env.SEQUENTIAL_API_KEY,
});

async function run() {
  const memory = await client.memory.query({
    query: "${currentQuery}",
    namespace: "${namespace}",
    mode: "${mode}",
    topK: ${topK.replace('Top ', '')},
    threshold: ${similarityThreshold},
    includeRelations: ${extractRelations}
  });

  console.log("Retrieved Entities:", memory.entities);
}

run();`
        }

        return `curl -X POST https://api.sequential.ai/v1/memory/query \\
  -H "Authorization: Bearer sk_live_seq_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "${currentQuery}",
    "namespace": "${namespace}",
    "mode": "${mode}",
    "topK": ${topK.replace('Top ', '')},
    "threshold": ${similarityThreshold}
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
            fallback={<PlaygroundFallback />}
            className="w-full min-w-0 h-screen flex flex-col overflow-hidden"
        >
            <div className="w-full h-screen flex flex-col overflow-hidden bg-[#FAF8F5] dark:bg-zinc-950">
                {/* Top Category Navigation Bar (Height: 48px / h-12) */}
                <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-[#FAF8F5] dark:bg-zinc-950 shrink-0">
                    {/* Top API Mode Tabs + Sidebar Trigger */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <SidebarTrigger className="-ml-1 h-7 w-7 mr-1 cursor-pointer text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white" />
                        {API_CATEGORIES.map((cat) => {
                            const Icon = cat.icon
                            const isActive = normalizedCategory === cat.id
                            return (
                                <Link
                                    key={cat.id}
                                    to={`/dashboard/playground/${cat.id}`}
                                    onClick={() => setActiveView('playground')}
                                    className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                                        ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-zinc-900 shadow-xs'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40'
                                        }`}
                                >
                                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500'}`} />
                                    <span>{cat.label}</span>
                                    {isActive && (
                                        <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Right Header Controls: Theme Toggle & History */}
                    <div className="flex items-center gap-2">
                        {/* Theme toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggle}
                            className="h-7 w-7 rounded text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                            title="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-3.5 w-3.5" />
                            ) : (
                                <Moon className="h-3.5 w-3.5" />
                            )}
                        </Button>

                        <button
                            type="button"
                            onClick={() => setActiveView(activeView === 'playground' ? 'history' : 'playground')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold font-mono uppercase transition-all cursor-pointer border ${activeView === 'history'
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100 shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                                }`}
                        >
                            <Clock className="h-3.5 w-3.5" />
                            HISTORY
                        </button>
                    </div>
                </div>

                {/* Main View: Resizable Playground Split Pane (Height: 100vh - Top Header Height 48px) */}
                {activeView === 'playground' && (
                    <div
                        ref={containerRef}
                        className="relative flex flex-col lg:flex-row w-full h-[calc(100vh-48px)] bg-[#FAF8F5] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden"
                    >
                        {/* ========================================================
                LEFT PANE: Configuration & Query Inputs
                ======================================================== */}
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

                                        <a
                                            href="https://docs.sequential.ai"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
                                        >
                                            Docs <ExternalLink className="h-3 w-3 text-zinc-400" />
                                        </a>
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
                                            rows={3}
                                            className="resize-none border-0 p-0 text-xs sm:text-sm font-sans bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none leading-relaxed"
                                        />

                                        {/* Bottom row inside Query box: Examples dropdown & Run Button */}
                                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                                            {/* Examples Dropdown */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800"
                                                    >
                                                        <span>Examples</span>
                                                        <ChevronDown className="h-3 w-3" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="start"
                                                    className="w-80 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl p-1.5 shadow-2xl"
                                                >
                                                    <DropdownMenuLabel className="text-[10px] uppercase font-mono text-zinc-400 px-2 py-1">
                                                        Sample Queries ({activeCategoryMeta.label})
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                                                    {activeCategoryMeta.prompts.map((sample, i) => (
                                                        <DropdownMenuItem
                                                            key={i}
                                                            onClick={() => setPrompt(sample)}
                                                            className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer py-1.5 px-2"
                                                        >
                                                            {sample}
                                                        </DropdownMenuItem>
                                                    ))}
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
                                        {/* Location & Language Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Location</label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left shadow-xs"
                                                        >
                                                            <span className="truncate">{location}</span>
                                                            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl p-1 shadow-xl">
                                                        {['US — United States', 'EU — European Union', 'GB — United Kingdom', 'Global — Worldwide'].map((loc) => (
                                                            <DropdownMenuItem
                                                                key={loc}
                                                                onClick={() => setLocation(loc)}
                                                                className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                                                            >
                                                                {loc}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Language</label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left shadow-xs"
                                                        >
                                                            <span className="truncate">{language}</span>
                                                            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-48 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl p-1 shadow-xl">
                                                        {['en — English', 'es — Spanish', 'de — German', 'fr — French', 'ja — Japanese'].map((lang) => (
                                                            <DropdownMenuItem
                                                                key={lang}
                                                                onClick={() => setLanguage(lang)}
                                                                className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                                                            >
                                                                {lang}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {/* Published Date Range */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Published date range</label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left shadow-xs"
                                                    >
                                                        <span className="truncate">{dateRange === 'Any time' ? 'Select date range' : dateRange}</span>
                                                        <Calendar className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl p-1 shadow-xl">
                                                    {['Any time', 'Past 24 hours', 'Past week', 'Past month', 'Past year'].map((d) => (
                                                        <DropdownMenuItem
                                                            key={d}
                                                            onClick={() => setDateRange(d)}
                                                            className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                                                        >
                                                            {d}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Speed / Depth Mode Selector */}
                                        <div className="space-y-1 pt-1">
                                            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Execution Depth</label>
                                            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                                {[
                                                    { id: 'FAST', label: 'FAST', desc: '1 worker' },
                                                    { id: 'STANDARD', label: 'STANDARD', desc: '4 workers' },
                                                    { id: 'DEEP', label: 'DEEP', desc: '6 DAGs' },
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

                                        {/* Structured Output Toggle */}
                                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 space-y-2">
                                            <label className="flex items-center justify-between cursor-pointer select-none text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:white">
                                                <span className="font-mono text-xs">{'{ }'} Structured JSON output</span>
                                                <Switch
                                                    checked={isStructuredOutput}
                                                    onCheckedChange={setIsStructuredOutput}
                                                    className="scale-90"
                                                />
                                            </label>

                                            {isStructuredOutput && (
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

                        {/* ========================================================
                DRAGGABLE DIVIDER / RESIZER HANDLE
                ======================================================== */}
                        <div
                            onMouseDown={(e) => {
                                e.preventDefault()
                                setIsDragging(true)
                            }}
                            onDoubleClick={() => setLeftWidth(38)}
                            title="Drag to resize pane (Double-click to reset)"
                            className={`hidden lg:flex items-center justify-center w-1.5 relative cursor-col-resize z-20 group transition-colors select-none shrink-0 h-full ${isDragging ? 'bg-primary' : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <div className="w-[1px] h-full bg-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700" />
                            <div className="absolute w-4 h-7 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xs">
                                <GripVertical className="h-3 w-3" />
                            </div>
                        </div>

                        {/* ========================================================
                RIGHT PANE: Full-Height Results Canvas
                ======================================================== */}
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
                                    onClick={() => setIsCodeModalOpen(true)}
                                    className="rounded px-4 py-2 text-xs font-mono font-semibold bg-primary text-white border border-zinc-700 dark:border-zinc-200 shadow-xl cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105"
                                >
                                    <Code2 className="h-3.5 w-3.5" />
                                    <span>Get Code</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================
            HISTORY VIEW (When History Tab Is Active)
            ======================================================== */}
                {activeView === 'history' && (
                    <div className="w-full h-[calc(100vh-48px)] overflow-y-auto p-4 sm:p-6 bg-[#FAF8F5] dark:bg-zinc-950">
                        <Card className="rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-950 p-6 space-y-5 shadow-xl text-zinc-900 dark:text-zinc-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Execution History</h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Recent task, monitor, and memory runs, latencies, token consumption, and outputs.
                                    </p>
                                </div>

                                <div className="w-full sm:w-72 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                                    <Input
                                        placeholder="Search history..."
                                        value={historySearch}
                                        onChange={(e) => setHistorySearch(e.target.value)}
                                        className="pl-9 h-8 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                    />
                                </div>
                            </div>

                            <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                                {historyList
                                    .filter((item) =>
                                        item.query.toLowerCase().includes(historySearch.toLowerCase()) ||
                                        item.id.toLowerCase().includes(historySearch.toLowerCase())
                                    )
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                                        >
                                            <div className="space-y-1 max-w-xl">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-200">{item.id}</span>
                                                    <Badge variant="outline" className="text-[10px] font-mono border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 uppercase">
                                                        {item.category || 'task'}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] font-mono border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                                                        {item.mode}
                                                    </Badge>
                                                    <StatusBadge status={item.status} />
                                                </div>
                                                <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-1">{item.query}</p>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.duration}</span>
                                                <span>{item.tokens?.toLocaleString()} tok</span>
                                                <span>${item.cost?.toFixed(4)}</span>
                                                <span>{item.createdAt}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const targetCat = item.category || 'task'
                                                        navigate(`/dashboard/playground/${targetCat}`)
                                                        setPrompt(item.query)
                                                        setCurrentResult(item)
                                                        setActiveView('playground')
                                                    }}
                                                    className="h-7 text-xs text-primary hover:bg-primary/10 rounded cursor-pointer"
                                                >
                                                    Load Result ↗
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* ========================================================
            GET CODE DIALOG MODAL
            ======================================================== */}
                <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
                    <DialogContent className="sm:max-w-2xl rounded-2xl p-6 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl">
                        <DialogHeader>
                            <div className="flex items-center justify-between pr-4">
                                <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Code2 className="h-5 w-5 text-primary" />
                                    {activeCategoryMeta.label} Code Snippet
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                                Copy and run this snippet directly in your backend codebase.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-2">
                            {/* Language Switcher Tabs */}
                            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                {[
                                    { id: 'python', label: 'Python SDK' },
                                    { id: 'node', label: 'TypeScript / Node' },
                                    { id: 'curl', label: 'cURL' },
                                ].map((lang) => (
                                    <button
                                        key={lang.id}
                                        type="button"
                                        onClick={() => setSelectedLanguage(lang.id)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer text-center ${selectedLanguage === lang.id
                                            ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700/60 font-semibold'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>

                            {/* Code snippet block */}
                            <div className="relative rounded-xl border border-zinc-800 bg-[#09090b] p-4 font-mono text-xs overflow-x-auto shadow-2xl text-zinc-100 min-h-[160px]">
                                <div className="table w-full">
                                    <SyntaxHighlightedCode code={getCodeSnippet()} language={selectedLanguage} />
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-[11px] font-mono text-zinc-500">
                                    Requires Sequential API key in environment
                                </span>
                                <Button
                                    onClick={handleCopyCode}
                                    className="rounded h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs gap-1.5 cursor-pointer"
                                >
                                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                    <span>{isCopied ? 'Copied to Clipboard' : 'Copy Code Snippet'}</span>
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </Skeleton>
    )
}
