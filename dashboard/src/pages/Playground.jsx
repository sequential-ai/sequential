import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/api/client'
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
import { BsTypescript } from "react-icons/bs";
import { SiCurl } from "react-icons/si";
import { FaPython } from "react-icons/fa";
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useTheme } from '@/context/ThemeContext'
import CodeDialog from '@/components/CodeDialog'
import PlaygroundHeader from '@/components/playground/PlaygroundHeader'
import PlaygroundHistory from '@/components/playground/PlaygroundHistory'
import PlaygroundLeftPane from '@/components/playground/PlaygroundLeftPane'
import PlaygroundRightPane from '@/components/playground/PlaygroundRightPane'

export const API_CATEGORIES = [
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


const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet())
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)

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
    const { tab, id } = useParams()
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
    const [responseFormat, setResponseFormat] = useState('markdown') // 'markdown' | 'json'
    const [includeTrace, setIncludeTrace] = useState(false)

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

    // Code Panel State
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState('python') // 'python' | 'ts' | 'curl'
    const [isCopied, setIsCopied] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)
    const [isOutputCopied, setIsOutputCopied] = useState(false)

    // History State
    const [historyList, setHistoryList] = useState([])
    const [historySearch, setHistorySearch] = useState('')

    // Fetch History on Mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.getTasks()
                if (res.data) {
                    setHistoryList(res.data)
                }
            } catch (err) {
                console.error("Failed to fetch tasks history:", err)
            }
        }
        if (!isSyncing) {
            fetchHistory()
        }
    }, [isSyncing])

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

    // Load task if ID is provided in URL
    useEffect(() => {
        if (!id) return;
        const loadTask = async () => {
            try {
                const res = await api.getTaskStatus(id);
                if (res.data) {
                    const taskData = res.data;
                    const generatedResult = {
                        id: taskData.id || taskData.run_id || id,
                        category: normalizedCategory,
                        query: taskData.query || 'Loaded Task',
                        run: taskData, // map flattened task directly as run 
                        output: taskData.output
                    };
                    setCurrentResult(generatedResult);
                    setPrompt(generatedResult.query);
                }
            } catch (err) {
                console.error("Failed to load task by ID:", err);
            }
        };
        loadTask();
    }, [id, normalizedCategory]);

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
    const handleRunTask = async () => {
        if (!prompt.trim() || isRunning) return

        setIsRunning(true)
        setCurrentResult(null)

        if (normalizedCategory === 'task') {
            setExecutionStep('Initializing task...')
            try {
                // Determine taskSpec to pass
                let taskSpec = null
                if (isStructuredOutput) {
                    try {
                        taskSpec = JSON.parse(schemaTemplate)
                    } catch (e) {
                        alert("Invalid JSON in Schema Template")
                        setIsRunning(false)
                        return
                    }
                }

                const res = await api.createTask({
                    query: prompt,
                    mode,
                    taskSpec,
                    responseFormat,
                    includeTrace
                })

                const taskId = res.data?.id || res.data?.run_id || res.data?.run?.run_id
                if (!taskId) {
                    throw new Error("No task ID returned")
                }

                setExecutionStep('Task running on backend... (Polling)')

                // Poll every 2 seconds
                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await api.getTaskStatus(taskId)
                        const taskData = statusRes.data

                        const status = taskData?.status || taskData?.run?.status
                        if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELED') {
                            clearInterval(pollInterval)

                            // Map backend task to playground result structure
                            const generatedResult = {
                                id: taskData.id || taskData?.run?.run_id,
                                category: 'task',
                                query: prompt,
                                run: taskData, // map flattened task directly as run 
                                output: taskData.output
                            }

                            setCurrentResult(generatedResult)
                            setHistoryList(prev => [generatedResult, ...prev])
                            setIsRunning(false)
                            setExecutionStep('')
                        }
                    } catch (pollErr) {
                        console.error("Polling error:", pollErr)
                        clearInterval(pollInterval)
                        setIsRunning(false)
                        setExecutionStep('Error checking task status')
                    }
                }, 2000)

            } catch (err) {
                console.error("Error creating task:", err)
                setIsRunning(false)
                setExecutionStep('Error starting task')
            }
        } else if (normalizedCategory === 'monitor') {
            setExecutionStep('Initiating telemetry stream listener...')
            setTimeout(() => {
                setExecutionStep('Evaluating p95/p99 anomaly threshold bounds...')
            }, 500)
            setTimeout(() => {
                setExecutionStep('Piping real-time event telemetry...')
            }, 1000)
            setTimeout(() => {
                const now = new Date().toISOString()
                const generatedResult = {
                    id: `mon_${Date.now().toString(36)}`,
                    category: 'monitor',
                    query: prompt,
                    run: {
                        run_id: `mon_${Date.now().toString(36)}`,
                        status: 'ACTIVE',
                        mode,
                        processor: mode,
                        metadata: { responseFormat: 'markdown', includeTrace: false },
                        usage: { cost: 0.0014, tokens: { total: 1420 }, duration_ms: 40 },
                        created_at: now,
                        modified_at: now,
                        completed_at: null,
                    },
                    output: {
                        type: 'markdown',
                        content: `### Active Stream Monitor: ${prompt}\n\nContinuous telemetry listener established. Verified **0 anomaly spikes** exceeding threshold \`${alertThreshold}\`.\n\n- **Target**: \`${prompt}\`\n- **Health Status**: 🟢 Healthy (SLA 99.99%)\n- **P95 Latency**: 36ms\n- **P99 Latency**: 48ms\n- **Webhook Dispatch**: \`${webhookUrl}\``,
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
                const now = new Date().toISOString()
                const generatedResult = {
                    id: `mem_${Date.now().toString(36)}`,
                    category: 'memory',
                    query: prompt,
                    run: {
                        run_id: `mem_${Date.now().toString(36)}`,
                        status: 'COMPLETED',
                        mode,
                        processor: mode,
                        metadata: { responseFormat: 'markdown', includeTrace: false },
                        usage: { cost: 0.0072, tokens: { total: 7200 }, duration_ms: 1100 },
                        created_at: now,
                        modified_at: now,
                        completed_at: now,
                    },
                    output: {
                        type: 'markdown',
                        content: `### Memory Context Graph Retrieval\n\nRetrieved high-confidence semantic entities from collection \`${namespace}\` matching query **"${prompt}"** with threshold \`>= ${similarityThreshold}\`.\n\n1. **Semantic Density**: 12 entity clusters identified with 0 contradiction markers.\n2. **Graph Traversal**: Linked cross-session tokens to verified organization identity.\n3. **Context Injection**: Memory payload formatted for zero-latency prompt augmentation.`,
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

    // Copy Output — reads from the new output.content key
    const handleCopyCurrentOutput = () => {
        if (!currentResult) return
        const textToCopy =
            outputFormat === 'json'
                ? JSON.stringify(currentResult, null, 2)
                : currentResult.output?.content || ''

        navigator.clipboard.writeText(textToCopy)
        setIsOutputCopied(true)
        setTimeout(() => setIsOutputCopied(false), 2000)
    }



    const playgroundState = {
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
        currentResult,
        isOutputCopied,
        outputFormat,
        executionStep,
        isCodeModalOpen,
    }

    const playgroundSetters = {
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
        setOutputFormat,
        setIsCodeModalOpen,
    }

    const playgroundHandlers = {
        handleKeyDown,
        handleRunTask,
        handleCopyCurrentOutput,
    }

    return (
        <Skeleton
            name="tasks-page"
            loading={isSyncing}
            fallback={<PlaygroundFallback />}
            className="w-full min-w-0 h-screen flex flex-col overflow-hidden"
        >
            <div className="w-full h-screen flex flex-col overflow-hidden bg-[#FAF8F5] dark:bg-zinc-950">
                <PlaygroundHeader
                    normalizedCategory={normalizedCategory}
                    setActiveView={setActiveView}
                    activeView={activeView}
                    theme={theme}
                    toggle={toggle}
                />

                {activeView === 'playground' && (
                    <div
                        ref={containerRef}
                        className="relative flex flex-col lg:flex-row w-full h-[calc(100vh-48px)] bg-[#FAF8F5] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden"
                    >
                        <PlaygroundLeftPane
                            leftWidth={leftWidth}
                            state={playgroundState}
                            setters={playgroundSetters}
                            handlers={playgroundHandlers}
                        />

                        {/* DRAGGABLE DIVIDER / RESIZER HANDLE */}
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

                        <PlaygroundRightPane
                            leftWidth={leftWidth}
                            state={playgroundState}
                            setters={playgroundSetters}
                            handlers={playgroundHandlers}
                        />
                    </div>
                )}

                {activeView === 'history' && (
                    <PlaygroundHistory
                        historyList={historyList}
                        historySearch={historySearch}
                        setHistorySearch={setHistorySearch}
                        navigate={navigate}
                        setPrompt={setPrompt}
                        setCurrentResult={setCurrentResult}
                        setActiveView={setActiveView}
                    />
                )}
            </div>
        </Skeleton>
    )

}