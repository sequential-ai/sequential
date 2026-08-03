import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  Bot,
  Search,
  RotateCw,
  Calendar,
  Layers,
  ChevronDown,
  ArrowUpRight,
  Cpu,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  Play,
  Server,
  Globe,
  ExternalLink,
  ShieldCheck,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

// Activity Chart Data (24h hourly volume)
const HOURLY_ACTIVITY_DATA = [
  { hour: '00:00', completed: 42, running: 1, failed: 0 },
  { hour: '02:00', completed: 31, running: 0, failed: 1 },
  { hour: '04:00', completed: 19, running: 0, failed: 0 },
  { hour: '06:00', completed: 28, running: 1, failed: 0 },
  { hour: '08:00', completed: 76, running: 2, failed: 1 },
  { hour: '10:00', completed: 124, running: 3, failed: 1 },
  { hour: '12:00', completed: 156, running: 2, failed: 0 },
  { hour: '14:00', completed: 182, running: 4, failed: 2 },
  { hour: '16:00', completed: 168, running: 3, failed: 1 },
  { hour: '18:00', completed: 142, running: 2, failed: 1 },
  { hour: '20:00', completed: 98, running: 2, failed: 0 },
  { hour: '22:00', completed: 64, running: 1, failed: 1 },
]

// Mock Runs including Active/Running, Completed, and Failed executions
const MOCK_RUNS = [
  {
    id: 'tsk_running_01',
    goal: 'Real-time web monitoring and anomaly synthesis across SEC 8-K filings',
    url: 'https://sec.gov/edgar/data/live-stream',
    mode: 'DEEP',
    workers: 6,
    activeWorkers: 6,
    credits: 24,
    tokens: 28400,
    cost: 0.0284,
    duration: '2.4s',
    elapsedMs: 2400,
    profile: 'o3-mini + claude-3.7',
    status: 'RUNNING',
    activeStep: 'Evaluating 42 streaming filings & semantic anomaly scores...',
    started: 'Just now',
    progressPct: 65,
  },
  {
    id: 'tsk_running_02',
    goal: 'Autonomous crawling and structured schema extraction of YC W26 batch companies',
    url: 'https://ycombinator.com/companies?batch=W26',
    mode: 'STANDARD',
    workers: 4,
    activeWorkers: 4,
    credits: 12,
    tokens: 14200,
    cost: 0.0142,
    duration: '1.8s',
    elapsedMs: 1800,
    profile: 'claude-3.7-sonnet',
    status: 'RUNNING',
    activeStep: 'Worker #3: DOM entity extraction & JSON schema validation...',
    started: '1 min ago',
    progressPct: 40,
  },
  {
    id: 'tsk_9f83a1b2',
    goal: 'Extract the first 15 job postings from Hacker News Jobs as structured schema',
    url: 'https://news.ycombinator.com/jobs',
    mode: 'DEEP',
    workers: 6,
    credits: 42,
    tokens: 42800,
    cost: 0.0428,
    duration: '4.2s',
    profile: 'o3-mini + claude-3.7',
    status: 'COMPLETED',
    started: '10 mins ago',
  },
  {
    id: 'tsk_7e62c4d8',
    goal: 'Synthesize cross-border regulatory compliance guidelines for FinTech AI deployment',
    url: 'https://compliance.eu/ai-act',
    mode: 'STANDARD',
    workers: 4,
    credits: 18,
    tokens: 18400,
    cost: 0.0184,
    duration: '1.8s',
    profile: 'claude-3.7-sonnet',
    status: 'COMPLETED',
    started: '25 mins ago',
  },
  {
    id: 'tsk_err_91a0',
    goal: 'Extract dynamic JS payload from bot-gated endpoint with strict Cloudflare Turnstile',
    url: 'https://protected-vault.internal/telemetry',
    mode: 'DEEP',
    workers: 6,
    credits: 4,
    tokens: 2100,
    cost: 0.0021,
    duration: '6.8s',
    profile: 'sequential-dag-v2',
    status: 'FAILED',
    errorReason: 'Target 403 Forbidden (Anti-bot challenge retry timeout)',
    started: '35 mins ago',
  },
  {
    id: 'tsk_5d11a9e3',
    goal: 'Crawl enterprise agentic architecture whitepapers and extract DAG specifications',
    url: 'https://arxiv.org/abs/2603.1892',
    mode: 'DEEP',
    workers: 6,
    credits: 35,
    tokens: 35200,
    cost: 0.0350,
    duration: '3.1s',
    profile: 'sequential-dag-v2',
    status: 'COMPLETED',
    started: '45 mins ago',
  },
  {
    id: 'tsk_3b19f0a4',
    goal: 'Benchmark latency and token efficiency across Claude 3.7 Sonnet vs OpenAI o3-mini',
    url: 'https://benchmarks.ai/latency',
    mode: 'FAST',
    workers: 2,
    credits: 8,
    tokens: 8200,
    cost: 0.0082,
    duration: '1.1s',
    profile: 'o3-mini',
    status: 'COMPLETED',
    started: '2 hours ago',
  },
  {
    id: 'tsk_2a84c719',
    goal: 'Real-time extraction of SEC Form 10-K risk factors for AI infrastructure providers',
    url: 'https://sec.gov/edgar/data',
    mode: 'DEEP',
    workers: 6,
    credits: 54,
    tokens: 54200,
    cost: 0.0542,
    duration: '5.4s',
    profile: 'o3-mini + claude-3.7',
    status: 'COMPLETED',
    started: '4 hours ago',
  },
  {
    id: 'tsk_1f90e54b',
    goal: 'Validate URL uptime and scrape dynamic DOM pricing tables across 8 cloud vendors',
    url: 'https://aws.amazon.com/pricing',
    mode: 'FAST',
    workers: 2,
    credits: 6,
    tokens: 6400,
    cost: 0.0064,
    duration: '0.9s',
    profile: 'o3-mini',
    status: 'COMPLETED',
    started: '6 hours ago',
  },
]

function MonitorFallback() {
  return (
    <div className="w-full space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UiSkeleton className="h-8 w-36 rounded-lg" />
          <UiSkeleton className="h-6 w-28 rounded-lg" />
        </div>
        <UiSkeleton className="h-8 w-48 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <UiSkeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <UiSkeleton className="lg:col-span-7 h-64 rounded-xl" />
        <UiSkeleton className="lg:col-span-5 h-64 rounded-xl" />
      </div>
      <UiSkeleton className="h-96 w-full rounded-xl" />
    </div>
  )
}

// Custom Tooltip for Execution Activity Chart
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc, curr) => acc + (curr.value || 0), 0)
    return (
      <div className="rounded-lg border border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs shadow-md space-y-1 font-mono">
        <div className="font-semibold text-zinc-900 dark:text-white flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-zinc-500">{total} tasks</span>
        </div>
        <div className="space-y-0.5 pt-1 border-t border-[#E8E2D2] dark:border-zinc-800 text-[11px]">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 capitalize">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export default function Monitor() {
  const { isSyncing } = useAuth()
  const navigate = useNavigate()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshedTime, setLastRefreshedTime] = useState('Just now')

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  const [modeFilter, setModeFilter] = useState('ALL') // 'ALL' | 'FAST' | 'STANDARD' | 'DEEP'
  const [dateRange, setDateRange] = useState('Last 24 hours')

  // Live timer tick for running tasks
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Refresh Trigger
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setLastRefreshedTime('Just now')
    }, 600)
  }

  // Filtered runs
  const filteredRuns = useMemo(() => {
    return MOCK_RUNS.filter((run) => {
      const matchesSearch =
        run.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.profile.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'ALL' || run.status === statusFilter
      const matchesMode = modeFilter === 'ALL' || run.mode === modeFilter

      return matchesSearch && matchesStatus && matchesMode
    })
  }, [searchQuery, statusFilter, modeFilter])

  // Count aggregates
  const runningCount = MOCK_RUNS.filter((r) => r.status === 'RUNNING').length
  const completedCount = MOCK_RUNS.filter((r) => r.status === 'COMPLETED').length
  const failedCount = MOCK_RUNS.filter((r) => r.status === 'FAILED').length

  return (
    <Skeleton
      name="monitor-page"
      loading={isSyncing}
      fallback={<MonitorFallback />}
      className="w-full min-w-0"
    >
      <div className="w-full space-y-4 text-zinc-900 dark:text-zinc-100 font-sans pb-8">
        {/* ========================================================
            1. COMPACT OBSERVABILITY HEADER
            ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-display">
                  Task Monitor
                </h1>

                {/* Live / Cluster Status Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Cluster Online</span>
                  <span className="text-zinc-400 dark:text-zinc-600">•</span>
                  <span className="text-zinc-500 dark:text-zinc-400">4 Regions</span>
                </div>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                AI-agent execution observability, worker load distribution, and real-time trace telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button with Timestamp */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-8 px-2.5 rounded border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 shadow-2xs cursor-pointer text-xs font-mono gap-1.5"
              title="Refresh telemetry stream"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#FB631B]' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </Button>

            {/* Date Range Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-white dark:bg-zinc-900 border border-[#E8E2D2] dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer shadow-2xs font-mono"
                >
                  <Calendar className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{dateRange}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 bg-white dark:bg-zinc-900 border-[#E8E2D2] dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg p-1 shadow-lg font-mono">
                {['Last 24 hours', 'Last 7 days', 'Last 30 days', 'All time'].map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() => setDateRange(d)}
                    className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer py-1.5"
                  >
                    {d}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Link to Playground */}
            <Link
              to="/dashboard/playground/monitor"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#FB631B] text-white hover:bg-[#e05413] transition-all shadow-2xs font-mono"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Test Stream</span>
            </Link>
          </div>
        </div>

        {/* ========================================================
            2. MINIMAL METRICS STRIP (Compact & Data-Dense)
            ======================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Total Executions */}
          <div className="p-3.5 rounded-xl border border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span>Executions</span>
              <Activity className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                1,428
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                +14.2%
              </span>
            </div>
          </div>

          {/* 2. Currently Running */}
          <div className="p-3.5 rounded-xl border border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span>Currently Running</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                {runningCount} Active
              </span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                10 DAG workers
              </span>
            </div>
          </div>

          {/* 3. Avg Duration */}
          <div className="p-3.5 rounded-xl border border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span>Avg Duration</span>
              <Clock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                2.14s
              </span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                p95: 4.8s
              </span>
            </div>
          </div>

          {/* 4. Success Rate */}
          <div className="p-3.5 rounded-xl border border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span>Success Rate</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                99.4%
              </span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                8 failed / 1.4k
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            3. MIDDLE ROW: EXECUTION ACTIVITY CHART + WORKER LOAD PANEL
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* Left (7 cols): Execution Activity Chart */}
          <div className="lg:col-span-7 rounded-xl border border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Execution Activity
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-mono text-zinc-500 border-[#E8E2D2] dark:border-zinc-800 py-0 px-1.5">
                    Hourly
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Task volume and outcome distribution over the last 24 hours
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-[#FB631B]" />
                  Completed
                </span>
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Running
                </span>
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Failed
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_ACTIVITY_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200, 200, 200, 0.2)" />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#FB631B" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="running" name="Running" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" stackId="a" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right (5 cols): Worker Load & Concurrency Panel */}
          <div className="lg:col-span-5 rounded-xl border border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Worker Load & Concurrency
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 py-0 px-1.5">
                    Nominal
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Cluster worker pool saturation & queue throughput
                </p>
              </div>
            </div>

            {/* Worker Utilization Gauge / Progress */}
            <div className="space-y-1.5 p-3 rounded-lg bg-[#FAF8F5] dark:bg-zinc-950 border border-[#E8E2D2] dark:border-zinc-800/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Worker Saturation</span>
                <span className="font-bold text-[#FB631B]">18 / 24 Active (75%)</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#FB631B] h-full rounded-full transition-all duration-500"
                  style={{ width: '75%' }}
                />
              </div>
            </div>

            {/* Worker Tiers Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg border border-[#E8E2D2] dark:border-zinc-800 bg-[#FAF8F5] dark:bg-zinc-950 space-y-0.5">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Fast</div>
                <div className="text-sm font-bold font-mono text-zinc-900 dark:text-white">8 / 10</div>
                <div className="text-[10px] text-zinc-400">1 worker/task</div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#E8E2D2] dark:border-zinc-800 bg-[#FAF8F5] dark:bg-zinc-950 space-y-0.5">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Standard</div>
                <div className="text-sm font-bold font-mono text-zinc-900 dark:text-white">6 / 8</div>
                <div className="text-[10px] text-zinc-400">4 workers/DAG</div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#E8E2D2] dark:border-zinc-800 bg-[#FAF8F5] dark:bg-zinc-950 space-y-0.5">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Deep DAG</div>
                <div className="text-sm font-bold font-mono text-zinc-900 dark:text-white">4 / 6</div>
                <div className="text-[10px] text-zinc-400">6 workers/DAG</div>
              </div>
            </div>

            {/* Footer Telemetry: Queue & Concurrency */}
            <div className="flex items-center justify-between pt-1 border-t border-[#E8E2D2] dark:border-zinc-800/80 text-[11px] font-mono text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span>Queue:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">0 (Instant)</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Max Concurrency:</span>
                <strong className="text-zinc-800 dark:text-zinc-200">32 Slots</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            4. RECENT RUNS EXECUTION CARDS (Clean, Data-Dense, Trace Clickable)
            ======================================================== */}
        <div className="rounded-xl border border-[#E8E2D2] dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs overflow-hidden">
          {/* Header Controls: Filters & Search */}
          <div className="p-3.5 sm:p-4 border-b border-[#E8E2D2] dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/80">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                  Recent Runs
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 border border-[#E8E2D2] dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                  {filteredRuns.length}
                </span>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#FAF8F5] dark:bg-zinc-950 border border-[#E8E2D2] dark:border-zinc-800 text-[11px] font-mono">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'RUNNING', label: `Running (${runningCount})` },
                  { id: 'COMPLETED', label: `Done (${completedCount})` },
                  { id: 'FAILED', label: `Failed (${failedCount})` },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-2xs font-semibold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Mode Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono bg-[#FAF8F5] dark:bg-zinc-950 border border-[#E8E2D2] dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer shadow-2xs"
                  >
                    <span>Mode: {modeFilter}</span>
                    <ChevronDown className="h-3 w-3 text-zinc-400 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-36 bg-white dark:bg-zinc-900 border-[#E8E2D2] dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg p-1 shadow-lg font-mono">
                  {['ALL', 'FAST', 'STANDARD', 'DEEP'].map((m) => (
                    <DropdownMenuItem
                      key={m}
                      onClick={() => setModeFilter(m)}
                      className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer"
                    >
                      {m}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <Input
                placeholder="Search by goal, URL, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 h-7.5 text-xs rounded-lg bg-[#FAF8F5] dark:bg-zinc-950 border-[#E8E2D2] dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-sans focus-visible:ring-1 focus-visible:ring-[#FB631B]"
              />
            </div>
          </div>

          {/* Runs Execution List */}
          <div className="divide-y divide-[#E8E2D2]/80 dark:divide-zinc-800/70">
            {filteredRuns.length > 0 ? (
              filteredRuns.map((run) => {
                const isRunning = run.status === 'RUNNING'
                const isFailed = run.status === 'FAILED'

                return (
                  <div
                    key={run.id}
                    onClick={() => navigate(`/dashboard/tasks/${run.id}`)}
                    className={`p-3.5 sm:p-4 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800/40 transition-all cursor-pointer group relative ${
                      isRunning ? 'bg-orange-500/2 dark:bg-orange-500/5' : ''
                    }`}
                  >
                    {/* Active Left Accent Bar for Running Tasks */}
                    {isRunning && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FB631B] rounded-r" />
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Left: Status, Goal, URL & Profile */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Meta Tags Row: ID, Mode, Status, Started */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {/* Status Badge */}
                          {isRunning ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-orange-500/10 border border-orange-500/30 text-[#FB631B]">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FB631B]"></span>
                              </span>
                              RUNNING
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                              <AlertCircle className="h-3 w-3" />
                              FAILED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              COMPLETED
                            </span>
                          )}

                          {/* Run ID Link */}
                          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-200 group-hover:text-[#FB631B] transition-colors">
                            {run.id}
                          </span>

                          {/* Mode Badge */}
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono border-[#E8E2D2] dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 py-0 px-1.5"
                          >
                            {run.mode}
                          </Badge>

                          {/* Timestamp */}
                          <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                            • {run.started}
                          </span>
                        </div>

                        {/* Task Goal / Title */}
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[#FB631B] transition-colors leading-snug">
                          {run.goal}
                        </h3>

                        {/* Live Active Step Description (for running tasks) */}
                        {isRunning && run.activeStep && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <RotateCw className="h-3 w-3 text-[#FB631B] animate-spin shrink-0" />
                            <span className="text-xs font-mono text-[#FB631B] animate-pulse">
                              {run.activeStep}
                            </span>
                          </div>
                        )}

                        {/* Error reason (for failed tasks) */}
                        {isFailed && run.errorReason && (
                          <div className="text-xs font-mono text-rose-500">
                            {run.errorReason}
                          </div>
                        )}

                        {/* Target URL & Profile */}
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate pt-0.5">
                          <span className="truncate max-w-sm sm:max-w-md text-zinc-600 dark:text-zinc-300">
                            {run.url}
                          </span>
                          <span>•</span>
                          <span className="text-zinc-400 dark:text-zinc-500">{run.profile}</span>
                        </div>
                      </div>

                      {/* Right Telemetry Strip: Duration, Tokens, Cost, Action */}
                      <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E2D2]/60 dark:border-zinc-800/60 font-mono text-xs">
                        {/* Duration */}
                        <div className="space-y-0.5 text-left md:text-right">
                          <div className="text-[10px] uppercase text-zinc-400">Duration</div>
                          <div className={`font-semibold ${isRunning ? 'text-[#FB631B] animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {run.duration}
                          </div>
                        </div>

                        {/* Tokens */}
                        <div className="space-y-0.5 text-left md:text-right">
                          <div className="text-[10px] uppercase text-zinc-400">Tokens</div>
                          <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                            {run.tokens.toLocaleString()}
                          </div>
                        </div>

                        {/* Cost */}
                        <div className="space-y-0.5 text-left md:text-right">
                          <div className="text-[10px] uppercase text-zinc-400">Cost</div>
                          <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                            ${run.cost.toFixed(4)}
                          </div>
                        </div>

                        {/* Inspect Trace Arrow */}
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 group-hover:text-[#FB631B] transition-colors pl-2">
                          <span className="hidden sm:inline">Trace</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              /* Empty Search State */
              <div className="py-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#FAF8F5] dark:bg-zinc-900 border border-[#E8E2D2] dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                  <Search className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  No task executions match the selected criteria.
                </p>
                {(searchQuery || statusFilter !== 'ALL' || modeFilter !== 'ALL') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('ALL')
                      setModeFilter('ALL')
                    }}
                    className="h-7 text-xs text-[#FB631B] font-mono cursor-pointer"
                  >
                    Reset all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Skeleton>
  )
}
