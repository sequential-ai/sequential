import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Calendar,
  RotateCw,
  Download,
  Search,
  MoreHorizontal,
  Code2,
  Copy,
  Check,
  Globe,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Cpu,
  Coins,
  ChevronRight,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Sparkles,
  Layers,
  Play,
} from 'lucide-react'

// Daily usage data spanning 07/03 to 08/02
const USAGE_TIMELINE = [
  { date: 'Jul 10', taskApi: 1, cost: 0.042, totalReq: 1 },
  { date: 'Jul 11', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 12', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 13', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 14', taskApi: 1, cost: 0.038, totalReq: 1 },
  { date: 'Jul 15', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 16', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 17', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 18', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 19', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 20', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 21', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 22', taskApi: 1, cost: 0.084, totalReq: 2 },
  { date: 'Jul 23', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 24', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 25', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 26', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 27', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 28', taskApi: 4, cost: 0.246, totalReq: 6, isPeak: true },
  { date: 'Jul 29', taskApi: 1, cost: 0.041, totalReq: 1 },
  { date: 'Jul 30', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Jul 31', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Aug 1', taskApi: 0, cost: 0.0, totalReq: 0 },
  { date: 'Aug 2', taskApi: 2, cost: 0.128, totalReq: 3 },
]

// Comprehensive mock API request logs with essential metrics
const INITIAL_REQUEST_LOGS = [
  {
    id: 'req_9f83a1b2',
    timestamp: 'Aug 2, 20:15:22',
    fullTimestamp: '2026-08-02 20:15:22 UTC',
    method: 'POST',
    path: '/v1/tasks',
    product: 'Task API v1',
    status: 201,
    statusText: 'Created',
    processor: 'Claude 3.7 Sonnet',
    tokens: 42800,
    cost: 0.0428,
    latency: '4.2s',
    apiKey: 'sk_live_...8f9a',
    requestBody: {
      query: 'Comprehensive market analysis for enterprise agentic AI architectures in 2026',
      mode: 'DEEP',
      taskSpec: { format: 'markdown', targetDepth: 'high' },
    },
    responseSummary: 'Task initialized with 6 parallel workers across SEC filings and benchmark graphs.',
    curl: 'curl -X POST https://api.sequential.ai/v1/tasks \\\n  -H "Authorization: Bearer sk_live_...8f9a" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"query":"Comprehensive market analysis...","mode":"DEEP"}\'',
  },
  {
    id: 'req_7e62c4d8',
    timestamp: 'Aug 2, 19:48:10',
    fullTimestamp: '2026-08-02 19:48:10 UTC',
    method: 'POST',
    path: '/v1/tasks',
    product: 'Task API v1',
    status: 201,
    statusText: 'Created',
    processor: 'OpenAI o3-mini',
    tokens: 18400,
    cost: 0.0184,
    latency: '1.8s',
    apiKey: 'sk_live_...8f9a',
    requestBody: {
      query: 'Synthesize cross-border regulatory compliance guidelines for FinTech AI deployment',
      mode: 'STANDARD',
    },
    responseSummary: 'EU AI Act Tier 2 guidelines synthesized with verified citations.',
    curl: 'curl -X POST https://api.sequential.ai/v1/tasks \\\n  -H "Authorization: Bearer sk_live_...8f9a" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"query":"Synthesize cross-border...","mode":"STANDARD"}\'',
  },
  {
    id: 'req_4d91e8a3',
    timestamp: 'Aug 2, 18:22:45',
    fullTimestamp: '2026-08-02 18:22:45 UTC',
    method: 'GET',
    path: '/v1/tasks/tsk_9f83a1b2',
    product: 'Task API v1',
    status: 200,
    statusText: 'OK',
    processor: 'Sequential Core',
    tokens: 0,
    cost: 0.0000,
    latency: '34ms',
    apiKey: 'sk_live_...8f9a',
    requestBody: null,
    responseSummary: 'Task status query returned COMPLETED with 100% citation confidence.',
    curl: 'curl -X GET https://api.sequential.ai/v1/tasks/tsk_9f83a1b2 \\\n  -H "Authorization: Bearer sk_live_...8f9a"',
  },
  {
    id: 'req_2c84b1f6',
    timestamp: 'Aug 2, 16:04:12',
    fullTimestamp: '2026-08-02 16:04:12 UTC',
    method: 'POST',
    path: '/v1/webhooks/test',
    product: 'Webhooks Pipeline',
    status: 200,
    statusText: 'OK',
    processor: 'Event Dispatcher',
    tokens: 320,
    cost: 0.0003,
    latency: '112ms',
    apiKey: 'sk_live_...8f9a',
    requestBody: { endpoint: 'https://api.company.com/webhooks', event: 'task.completed' },
    responseSummary: 'Test ping delivered with HTTP 200 response code.',
    curl: 'curl -X POST https://api.sequential.ai/v1/webhooks/test \\\n  -H "Authorization: Bearer sk_live_...8f9a" \\\n  -d \'{"event":"task.completed"}\'',
  },
  {
    id: 'req_1a73e5d9',
    timestamp: 'Jul 28, 23:14:02',
    fullTimestamp: '2026-07-28 23:14:02 UTC',
    method: 'POST',
    path: '/v1/tasks',
    product: 'Task API v1',
    status: 201,
    statusText: 'Created',
    processor: 'Claude 3.7 Sonnet',
    tokens: 68100,
    cost: 0.0681,
    latency: '3.1s',
    apiKey: 'sk_live_...8f9a',
    requestBody: { query: 'Benchmarking latency and token efficiency across Claude 3.7 vs o3-mini', mode: 'DEEP' },
    responseSummary: 'Benchmark synthesis produced 34 verified metrics and token comparisons.',
    curl: 'curl -X POST https://api.sequential.ai/v1/tasks \\\n  -H "Authorization: Bearer sk_live_...8f9a" \\\n  -d \'{"query":"Benchmarking latency...","mode":"DEEP"}\'',
  },
  {
    id: 'req_5b29f0c1',
    timestamp: 'Jul 28, 14:09:55',
    fullTimestamp: '2026-07-28 14:09:55 UTC',
    method: 'POST',
    path: '/v1/tasks',
    product: 'Task API v1',
    status: 429,
    statusText: 'Too Many Requests',
    processor: 'Rate Limiter',
    tokens: 0,
    cost: 0.0000,
    latency: '12ms',
    apiKey: 'sk_test_...1b4c',
    requestBody: { query: 'Bulk batch evaluation loop' },
    responseSummary: 'Rate limit exceeded: workspace tier limit of 1,000 req/min exceeded.',
    curl: 'curl -X POST https://api.sequential.ai/v1/tasks \\\n  -H "Authorization: Bearer sk_test_...1b4c" \\\n  -d \'{"query":"Bulk batch evaluation loop"}\'',
  },
]

// Custom Tooltip Component matching reference
const CustomTooltip = ({ active, payload, label, showMonetary }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-xl border border-border/80 bg-popover p-3 shadow-lg text-xs font-sans space-y-1.5 min-w-[240px]">
        <div className="text-[10px] text-muted-foreground font-mono">Time window (UTC)</div>
        <div className="text-[11px] font-semibold text-foreground">
          {data.date}/2026, 12:00:00 AM to {data.date}/2026, 11:59:59 PM
        </div>
        <div className="pt-1.5 border-t border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-foreground">
            <span className="w-2 h-2 rounded-none bg-primary" />
            <span>Task API v1</span>
          </div>
          <span className="font-mono font-bold text-foreground">
            {showMonetary ? `$${data.cost.toFixed(3)}` : `${data.taskApi} req`}
          </span>
        </div>
      </div>
    )
  }
  return null
}

function UsageFallback() {
  return (
    <div className="w-full space-y-4 p-1">
      <UiSkeleton className="h-8 w-28 rounded-lg" />
      <div className="flex items-center gap-2">
        <UiSkeleton className="h-8 w-32 rounded-lg" />
        <UiSkeleton className="h-8 w-32 rounded-lg" />
        <UiSkeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
        <div className="flex justify-between items-center">
          <UiSkeleton className="h-5 w-40 rounded" />
          <UiSkeleton className="h-7 w-32 rounded-lg" />
        </div>
        <UiSkeleton className="h-64 w-full rounded-xl" />
      </div>
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-3">
        <UiSkeleton className="h-5 w-32 rounded" />
        {[1, 2, 3, 4].map((i) => (
          <UiSkeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function Usage() {
  const { isSyncing } = useAuth()
  const navigate = useNavigate()

  // Top Filter States
  const [productFilter, setProductFilter] = useState('All')
  const [processorFilter, setProcessorFilter] = useState('All')
  const [apiKeyFilter, setApiKeyFilter] = useState('All')
  const [groupBy, setGroupBy] = useState('Product')
  const [showMonetary, setShowMonetary] = useState(false)

  // Request Log Filter & Search
  const [logSearch, setLogSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [inspectTab, setInspectTab] = useState('payload')
  const [copiedField, setCopiedField] = useState(null)

  // Export State
  const [isExporting, setIsExporting] = useState(false)

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(INITIAL_REQUEST_LOGS, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", "sequential_usage_export.json")
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      setIsExporting(false)
    }, 500)
  }

  const filteredLogs = INITIAL_REQUEST_LOGS.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(logSearch.toLowerCase()) ||
      req.path.toLowerCase().includes(logSearch.toLowerCase()) ||
      req.processor.toLowerCase().includes(logSearch.toLowerCase()) ||
      req.apiKey.toLowerCase().includes(logSearch.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === '2XX'
        ? req.status >= 200 && req.status < 300
        : statusFilter === '4XX'
        ? req.status >= 400 && req.status < 500
        : req.status >= 500

    return matchesSearch && matchesStatus
  })

  return (
    <Skeleton
      name="usage-page"
      loading={isSyncing}
      fallback={<UsageFallback />}
      className="w-full min-w-0"
    >
      <div className="w-full max-w-full min-w-0 space-y-4">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Usage</h1>
      </div>

      {/* Filter Toolbar (Matching Reference Layout) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Product Filter */}
          <div className="flex items-center rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-muted-foreground mr-1">Product:</span>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer text-xs"
            >
              <option value="All">All</option>
              <option value="Task API v1">Task API v1</option>
              <option value="Synthesis Pipeline">Synthesis Pipeline</option>
              <option value="Webhooks Pipeline">Webhooks Pipeline</option>
            </select>
          </div>

          {/* Processor Filter */}
          <div className="flex items-center rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-muted-foreground mr-1">Processor:</span>
            <select
              value={processorFilter}
              onChange={(e) => setProcessorFilter(e.target.value)}
              className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer text-xs"
            >
              <option value="All">All</option>
              <option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet</option>
              <option value="OpenAI o3-mini">OpenAI o3-mini</option>
              <option value="Sequential Core">Sequential Core</option>
            </select>
          </div>

          {/* API Key Filter */}
          <div className="flex items-center rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-muted-foreground mr-1">API Key:</span>
            <select
              value={apiKeyFilter}
              onChange={(e) => setApiKeyFilter(e.target.value)}
              className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer text-xs"
            >
              <option value="All">All</option>
              <option value="sk_live_...8f9a">Production (sk_live_...8f9a)</option>
              <option value="sk_test_...1b4c">Staging (sk_test_...1b4c)</option>
            </select>
          </div>

          {/* Date Range Picker Pill */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs shadow-2xs font-mono">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground text-[11px]">07/03/2026 - 08/02/2026 (UTC)</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer transition-colors"
              title="Reset date range"
            >
              <RotateCw className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        {/* Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="rounded-lg h-7 px-2.5 text-xs flex items-center gap-1 font-medium shadow-2xs cursor-pointer"
        >
          <Download className="h-3 w-3" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>

      {/* Secondary Controls: Group By & Monetary Toggle */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Group by</span>
          <div className="flex items-center rounded-lg border border-border/80 bg-card px-2.5 py-0.5 shadow-2xs">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer text-xs"
            >
              <option value="Product">Product</option>
              <option value="Processor">Processor</option>
              <option value="API Key">API Key</option>
            </select>
          </div>
        </div>

        {/* Monetary Switch */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-muted-foreground hover:text-foreground text-xs">
          <span>Show monetary values</span>
          <Switch
            checked={showMonetary}
            onCheckedChange={setShowMonetary}
            className="scale-75"
          />
        </label>
      </div>

      {/* Main Breakdown Chart Card (Wide Flat-Top Rectangular Bars) */}
      <Card className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3 min-w-0 w-full overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">
            Breakdown by {groupBy}
          </h2>
          <span className="text-[11px] font-mono text-muted-foreground">
            {showMonetary ? 'Values in USD ($)' : 'Total API Requests'}
          </span>
        </div>

        {/* Chart Container with Wider Flat Bars */}
        <div className="h-56 w-full min-w-0 pt-2 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={USAGE_TIMELINE} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                interval={1}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (showMonetary ? `$${val}` : val)}
              />
              <Tooltip content={<CustomTooltip showMonetary={showMonetary} />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
              <Bar
                dataKey={showMonetary ? 'cost' : 'taskApi'}
                fill="var(--primary, #F2541B)"
                radius={[0, 0, 0, 0]}
                barSize={32}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Clean, Non-Overflowing Table of All Requests */}
      <Card className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs space-y-0 min-w-0 w-full">
        {/* Table Header & Controls */}
        <div className="p-3.5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-foreground">All API Requests</h2>
            <p className="text-[11px] text-muted-foreground">Real-time log of raw API requests, latency, token consumption, and processor traces.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search endpoints or paths..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="h-7.5 pl-8 text-xs w-44 sm:w-52 rounded-lg bg-muted/30"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/30 text-xs">
              {['ALL', '2XX', '4XX'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase transition-all cursor-pointer ${
                    statusFilter === s
                      ? 'bg-background text-primary shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Table (Important Columns Only) */}
        <div className="w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-border/70 text-[11px] font-mono font-medium text-muted-foreground/80 bg-muted/20">
                <th className="py-2.5 px-3.5 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3.5 font-semibold">Endpoint</th>
                <th className="py-2.5 px-3.5 font-semibold">Status</th>
                <th className="py-2.5 px-3.5 font-semibold">Tokens</th>
                <th className="py-2.5 px-3.5 font-semibold">Cost</th>
                <th className="py-2.5 px-3.5 font-semibold">Latency</th>
                <th className="py-2.5 px-3.5 text-right font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {filteredLogs.map((req) => (
                <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                  {/* Timestamp */}
                  <td className="py-2.5 px-3.5 font-mono text-muted-foreground whitespace-nowrap text-[11px]">
                    {req.timestamp}
                  </td>

                  {/* Endpoint */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-foreground">
                      <span className="font-bold text-primary mr-1">{req.method}</span>
                      {req.path}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono font-bold ${
                        req.status >= 200 && req.status < 300
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : req.status === 429
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {req.status} {req.statusText}
                    </Badge>
                  </td>

                  {/* Tokens */}
                  <td className="py-2.5 px-3.5 font-mono text-muted-foreground whitespace-nowrap">
                    {req.tokens ? (req.tokens > 1000 ? `${(req.tokens / 1000).toFixed(1)}k` : req.tokens) : '—'}
                  </td>

                  {/* Cost */}
                  <td className="py-2.5 px-3.5 font-mono text-muted-foreground whitespace-nowrap">
                    ${req.cost.toFixed(4)}
                  </td>

                  {/* Latency */}
                  <td className="py-2.5 px-3.5 font-mono text-muted-foreground whitespace-nowrap">
                    {req.latency}
                  </td>

                  {/* Three-Dot Menu */}
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 text-xs">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRequest(req)
                            setInspectTab('payload')
                          }}
                          className="cursor-pointer font-medium flex items-center gap-2"
                        >
                          <Code2 className="h-3.5 w-3.5 text-primary" />
                          Inspect Request
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopy(req.id, `id_${req.id}`)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Request ID
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopy(req.curl, `curl_${req.id}`)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Terminal className="h-3.5 w-3.5" />
                          Copy cURL
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate(`/dashboard/tasks`)}
                          className="cursor-pointer text-primary flex items-center gap-2"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Open in Playground
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Redesigned Premium Request Inspection Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        {selectedRequest && (
          <DialogContent className="sm:max-w-2xl rounded-2xl p-6 space-y-4">
            <DialogHeader className="space-y-2">
              {/* Header Title with Method and Status */}
              <div className="flex items-center justify-between gap-3 pr-6">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-primary text-white">
                    {selectedRequest.method}
                  </span>
                  <DialogTitle className="text-base font-bold font-mono tracking-tight text-foreground">
                    {selectedRequest.path}
                  </DialogTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-mono font-bold ${
                    selectedRequest.status >= 200 && selectedRequest.status < 300
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}
                >
                  {selectedRequest.status} {selectedRequest.statusText}
                </Badge>
              </div>

              {/* Sub-Header Request ID & Copy */}
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-0.5">
                <div className="flex items-center gap-2">
                  <span>ID: {selectedRequest.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedRequest.id, 'modal_id')}
                    className="hover:text-foreground cursor-pointer transition-colors"
                    title="Copy Request ID"
                  >
                    {copiedField === 'modal_id' ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-70" />
                    )}
                  </button>
                </div>
                <span>{selectedRequest.fullTimestamp}</span>
              </div>
            </DialogHeader>

            {/* Quick Metrics 4-Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/70 font-mono text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">PROCESSOR</span>
                <span className="font-bold text-foreground mt-0.5 block truncate text-[11px]">
                  {selectedRequest.processor}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">LATENCY</span>
                <span className="font-bold text-foreground mt-0.5 block text-[11px]">
                  {selectedRequest.latency}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">TOKEN SPEND</span>
                <span className="font-bold text-foreground mt-0.5 block text-[11px]">
                  {selectedRequest.tokens ? selectedRequest.tokens.toLocaleString() : '0'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">UNIT COST</span>
                <span className="font-bold text-foreground mt-0.5 block text-[11px]">
                  ${selectedRequest.cost.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Tabs: Request Payload, Response Diagnostics, cURL */}
            <Tabs value={inspectTab} onValueChange={setInspectTab} className="w-full space-y-3">
              <TabsList className="grid grid-cols-3 h-8 rounded-lg p-0.5 bg-muted/60 text-xs">
                <TabsTrigger value="payload" className="text-[11px] rounded-md font-medium">
                  Request Payload
                </TabsTrigger>
                <TabsTrigger value="diagnostics" className="text-[11px] rounded-md font-medium">
                  Diagnostics & Trace
                </TabsTrigger>
                <TabsTrigger value="curl" className="text-[11px] rounded-md font-medium">
                  cURL Command
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Request Payload */}
              <TabsContent value="payload" className="space-y-2 focus-visible:outline-none">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>Application JSON Payload</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(selectedRequest.requestBody, null, 2), 'payload')}
                    className="flex items-center gap-1 hover:text-foreground cursor-pointer text-[10px] font-sans"
                  >
                    {copiedField === 'payload' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    Copy JSON
                  </button>
                </div>
                <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-zinc-100 font-mono text-[11px] max-h-56 overflow-y-auto">
                  {selectedRequest.requestBody ? (
                    <pre className="whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(selectedRequest.requestBody, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-zinc-500 italic">No request body provided (GET endpoint).</span>
                  )}
                </div>
              </TabsContent>

              {/* Tab 2: Diagnostics & Trace */}
              <TabsContent value="diagnostics" className="space-y-2 focus-visible:outline-none">
                <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-muted-foreground block">SYNTHESIS EXECUTION</span>
                    <p className="text-foreground text-xs mt-0.5 leading-relaxed font-sans">
                      {selectedRequest.responseSummary}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>API Key: {selectedRequest.apiKey}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cache: MISS</span>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: cURL Command */}
              <TabsContent value="curl" className="space-y-2 focus-visible:outline-none">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>Terminal Command</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedRequest.curl, 'curl')}
                    className="flex items-center gap-1 hover:text-foreground cursor-pointer text-[10px] font-sans"
                  >
                    {copiedField === 'curl' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    Copy cURL
                  </button>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-zinc-100 font-mono text-[11px] max-h-56 overflow-x-auto whitespace-pre">
                  {selectedRequest.curl}
                </div>
              </TabsContent>
            </Tabs>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedRequest(null)
                  navigate('/dashboard/tasks')
                }}
                className="rounded-lg text-xs font-bold text-white shadow-xs font-mono flex items-center gap-1.5"
                style={{ background: 'var(--primary, #F2541B)' }}
              >
                <Play className="h-3 w-3 fill-current" />
                Playground Replay
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
    </Skeleton>
  )
}
