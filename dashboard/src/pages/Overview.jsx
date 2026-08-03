import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { useUser } from '@clerk/clerk-react'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Globe,
  Zap,
  Clock,
  CheckCircle2,
  Cpu,
  Layers,
  Bot,
  User,
  ArrowRight,
  Play,
  RotateCw,
  Copy,
  Check,
  KeyRound,
  Terminal,
  Activity,
  ShieldCheck,
  Webhook,
  ExternalLink,
  Database,
  ChevronRight,
} from 'lucide-react'
import { ListTodo } from 'lucide-react'
import { Crosshair } from 'lucide-react'

// Compact Barcode / Segmented Vertical Bar Indicator Component
function BarcodeIndicator({ total = 20, filled = 15, color = 'bg-primary', trackColor = 'bg-black/5 dark:bg-white/5' }) {
  return (
    <div className="flex items-center gap-1 w-full py-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-4 flex-1 rounded-xs transition-all ${i < filled ? color : trackColor
            }`}
        />
      ))}
    </div>
  )
}
const playgroundItems = [
  {
    title: "Task API",
    description: "Run agents & execute prompts",
    icon: ListTodo,
    href: "/dashboard/playground",
  },
  {
    title: "Monitor",
    description: "Telemetry & execution logs",
    icon: Crosshair,
    href: "/dashboard/monitor",
  },
  {
    title: "Memory",
    description: "Context & vector storage",
    icon: Database,
    href: "/dashboard/memory",
  },
];

const MONTHLY_DATA = [
  { month: 'JAN', value: 180, formatted: '$180K', tokens: '14.2M' },
  { month: 'FEB', value: 240, formatted: '$240K', tokens: '19.8M' },
  { month: 'MAR', value: 210, formatted: '$210K', tokens: '17.4M' },
  { month: 'APR', value: 310, formatted: '$310K', tokens: '25.6M' },
  { month: 'MAY', value: 280, formatted: '$280K', tokens: '23.1M' },
  { month: 'JUN', value: 420, formatted: '$420K', tokens: '34.8M' },
  { month: 'JUL', value: 390, formatted: '$390K', tokens: '31.2M' },
  { month: 'AUG', value: 640, formatted: '$640K', tokens: '52.4M', isPeak: true },
  { month: 'SEP', value: 480, formatted: '$480K', tokens: '39.6M' },
  { month: 'OCT', value: 350, formatted: '$350K', tokens: '28.9M' },
  { month: 'NOV', value: 410, formatted: '$410K', tokens: '33.5M' },
  { month: 'DEC', value: 520, formatted: '$520K', tokens: '43.0M' },
]

function OverviewFallback() {
  return (
    <div className="w-full space-y-4 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="space-y-1.5">
          <UiSkeleton className="h-7 w-48 rounded-lg" />
          <UiSkeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <UiSkeleton className="h-8 w-36 rounded-lg" />
          <UiSkeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2">
            <div className="flex justify-between items-center">
              <UiSkeleton className="h-3.5 w-24 rounded" />
              <UiSkeleton className="h-4 w-12 rounded" />
            </div>
            <UiSkeleton className="h-7 w-20 rounded" />
            <UiSkeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border/80 bg-card space-y-4">
          <div className="flex justify-between items-center">
            <UiSkeleton className="h-5 w-40 rounded" />
            <UiSkeleton className="h-7 w-32 rounded-lg" />
          </div>
          <UiSkeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
          <UiSkeleton className="h-5 w-32 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <UiSkeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Overview() {
  const { user } = useUser()
  const { dbUser, isSyncing } = useAuth()
  const navigate = useNavigate()

  // User Display Name
  const firstName = user?.firstName || dbUser?.name?.split(' ')[0] || 'Robert'

  // State
  const [selectedMonth, setSelectedMonth] = useState('AUG')
  const [metricFilter, setMetricFilter] = useState('Net Revenue')

  // Quick Prompt Runner
  const [quickPrompt, setQuickPrompt] = useState('')
  const [isExecutingQuick, setIsExecutingQuick] = useState(false)

  // Copy states
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedInstall, setCopiedInstall] = useState(false)

  // New Task Dialog
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [newPrompt, setNewPrompt] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleQuickRun = (e) => {
    e.preventDefault()
    if (!quickPrompt.trim() || isExecutingQuick) return
    setIsExecutingQuick(true)
    setTimeout(() => {
      setIsExecutingQuick(false)
      navigate('/dashboard/tasks')
    }, 600)
  }

  const handleCreateTask = (e) => {
    e.preventDefault()
    if (!newPrompt.trim()) return
    setIsCreating(true)
    setTimeout(() => {
      setIsCreating(false)
      setIsNewTaskOpen(false)
      navigate('/dashboard/tasks')
    }, 600)
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText('sk_live_sample_key_sequential')
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleCopyInstall = () => {
    navigator.clipboard.writeText('npm i @sequential-ai/sdk')
    setCopiedInstall(true)
    setTimeout(() => setCopiedInstall(false), 2000)
  }

  return (
    <Skeleton
      name="overview-page"
      loading={isSyncing}
      fallback={<OverviewFallback />}
      className="w-full min-w-0"
    >
      <div className="w-full max-w-full min-w-0 space-y-4">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Hello, {firstName} <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here is today's snapshot of task executions, credit spend, and agent operations.
          </p>
        </div>

        {/* Quick Actions & CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* SDK Quick Copy */}
          <button
            type="button"
            onClick={handleCopyInstall}
            className="h-8 px-2.5 rounded border border-border/80 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy SDK Install Command"
          >
            <Terminal className="h-3 w-3 text-primary" />
            <span>npm i @sequential-ai/sdk</span>
            {copiedInstall ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-60" />}
          </button>

          {/* Primary CTA */}
          <Button
            size="sm"
            onClick={() => setIsNewTaskOpen(true)}
            className="rounded h-8 px-3.5 text-xs font-bold text-white shadow-xs cursor-pointer flex items-center gap-1.5 font-mono"
            style={{ background: 'var(--primary, #F2541B)' }}
          >

            New Task
          </Button>
        </div>
      </div>

      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Synthesis Tasks */}
        <Card className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Synthesis Tasks</span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-1.5 py-0">
              +12.8%
            </Badge>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-foreground tracking-tight">128</span>
            <span className="text-[11px] text-muted-foreground font-mono">/ 160 tasks</span>
          </div>

          <BarcodeIndicator total={20} filled={16} color="bg-primary" />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span className="font-medium text-foreground">80% completed</span>
            <span>32 in queue</span>
          </div>
        </Card>

        {/* Metric 2: Parallel Workers */}
        <Card className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Parallel Workers</span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-1.5 py-0">
              +3.5%
            </Badge>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-foreground tracking-tight">67</span>
            <span className="text-[11px] text-muted-foreground font-mono">/ 90 nodes</span>
          </div>

          <BarcodeIndicator total={20} filled={15} color="bg-orange-400 dark:bg-orange-500" />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span className="font-medium text-foreground">74% utilized</span>
            <span>23 available</span>
          </div>
        </Card>

        {/* Metric 3: Active Workflows */}
        <Card className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Active Workflows</span>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-bold px-1.5 py-0">
              -1.9%
            </Badge>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-foreground tracking-tight">21</span>
            <span className="text-[11px] text-muted-foreground font-mono">/ 30 active</span>
          </div>

          <BarcodeIndicator total={20} filled={14} color="bg-rose-400/90 dark:bg-rose-500/90" />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span className="font-medium text-foreground">70% running</span>
            <span>9 idle</span>
          </div>
        </Card>

        {/* Metric 4: API Latency & Health */}
        <Card className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Pipeline Health</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              99.98%
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-foreground tracking-tight">1.18s</span>
            <span className="text-[11px] text-muted-foreground font-mono">avg latency</span>
          </div>

          <BarcodeIndicator total={20} filled={19} color="bg-emerald-500" />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span className="font-medium text-foreground">0 errors</span>
            <span>US-East & EU-West</span>
          </div>
        </Card>
      </div>

      {/* Main Analytics Card & Quick Runner & Explore */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (Chart & Quick Prompt) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4 min-w-0 w-full overflow-hidden">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Net Revenue / Credit Spend</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-sans">
                    $640,000.00
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                    ↗ +8.2% <span className="font-normal text-muted-foreground text-[10px]">vs last month</span>
                  </span>
                </div>

                {/* Sub Metrics */}
                <div className="flex flex-wrap items-center gap-5 pt-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Peak Month</span>
                    <span className="font-bold text-foreground text-[11px]">AUG $640K</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Monthly Avg</span>
                    <span className="font-bold text-foreground text-[11px]">$232K</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">YTD Volume</span>
                    <span className="font-bold text-foreground text-[11px]">348.6M tokens</span>
                  </div>
                </div>
              </div>

              {/* Metric Filter Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={metricFilter}
                  onChange={(e) => setMetricFilter(e.target.value)}
                  className="h-7 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="Net Revenue">Net Revenue</option>
                  <option value="Token Volume">Token Volume</option>
                  <option value="Worker Hours">Worker Hours</option>
                </select>
              </div>
            </div>

            {/* Compact Stylized Bar Chart */}
            <div className="relative pt-4 pb-1">
              {/* Dashed Horizontal Peak Reference Line */}
              <div className="absolute top-7 left-0 right-0 border-b border-dashed border-border/80 flex items-center justify-start pointer-events-none">
                <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded-sm bg-foreground text-background -translate-y-1/2">
                  $640K
                </span>
              </div>

              {/* Bars */}
              <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 items-end h-44 pt-6">
                {MONTHLY_DATA.map((item) => {
                  const heightPercentage = Math.round((item.value / 640) * 100)
                  const isSelected = selectedMonth === item.month

                  return (
                    <div
                      key={item.month}
                      onClick={() => setSelectedMonth(item.month)}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer h-full justify-end"
                    >
                      {/* Tooltip */}
                      <div
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md transition-all ${isSelected || item.isPeak
                            ? 'bg-primary text-white scale-100 opacity-100'
                            : 'opacity-0 group-hover:opacity-100 bg-foreground text-background'
                          }`}
                      >
                        {metricFilter === 'Token Volume' ? item.tokens : item.formatted}
                      </div>

                      {/* Bar Pill */}
                      <div className="w-full bg-muted/40 rounded-t-md relative flex flex-col justify-end overflow-hidden h-full max-w-[36px]">
                        <div
                          style={{ height: `${heightPercentage}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${item.isPeak
                              ? 'bg-primary shadow-xs'
                              : isSelected
                                ? 'bg-primary/80'
                                : 'bg-primary/25 group-hover:bg-primary/45'
                            }`}
                        >
                          {!item.isPeak && (
                            <div className="w-full h-full opacity-35 bg-[linear-gradient(45deg,rgba(0,0,0,0.06)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.06)_50%,rgba(0,0,0,0.06)_75%,transparent_75%,transparent)] bg-[length:6px_6px]" />
                          )}
                        </div>
                      </div>

                      {/* Month Label */}
                      <span
                        className={`text-[10px] font-mono font-medium transition-colors ${isSelected || item.isPeak
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                      >
                        {item.month}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Quick Prompt Command Bar */}
          <Card className="rounded-xl border border-border/80 bg-card p-3 shadow-2xs">
            <form onSubmit={handleQuickRun} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <Input
                placeholder="Quick Task: Run market analysis, code audit, or research query..."
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                className="h-8 text-xs bg-muted/30 border-border/70 rounded-lg flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!quickPrompt.trim() || isExecutingQuick}
                className="rounded h-8 px-3 text-xs font-bold text-white shadow-xs flex items-center gap-1 font-mono shrink-0"
                style={{ background: 'var(--primary, #F2541B)' }}
              >
                {isExecutingQuick ? (
                  <RotateCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 fill-current" />
                )}
                Run
              </Button>
            </form>
          </Card>
        </div>

          {/* Right Column — Explore */}
          <div className="lg:col-span-1 flex flex-col">
            {/* Header */}
            <div className="mb-3">
              <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                Explore
              </h3>

              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Quick access to workspace tools
              </p>
            </div>

            {/* Navigation Panel */}
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
              {playgroundItems.map((item, index) => {
                const Icon = item.icon;
                const isLast = index === playgroundItems.length - 1;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "group flex w-full items-center gap-3",
                      "px-3.5 py-3 text-left",
                      "transition-colors duration-150",
                      "hover:bg-black/[0.025]",
                      "dark:hover:bg-white/[0.035]",
                      !isLast && "border-b border-border/60"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-lg
              bg-black/[0.04]
              text-foreground/60
              transition-colors
              dark:bg-white/[0.06]
              group-hover:bg-primary/10
              group-hover:text-primary
            "
                    >
                      <Icon className="h-[17px] w-[17px] stroke-[1.6]" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-foreground">
                        {item.title}
                      </div>

                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {item.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight
                      className="
              h-4 w-4 shrink-0
              text-muted-foreground/30
              transition-all duration-150
              group-hover:translate-x-0.5
              group-hover:text-primary
            "
                    />
                  </button>
                );
              })}
            </div>
          </div>
      </div>

      {/* Operational Intelligence (3 Useful Modular Panels) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Panel 1: Model Routing Distribution */}
        <Card className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              Model Traffic Routing
            </span>
            <Badge variant="outline" className="text-[9px] font-mono">LIVE</Badge>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-medium text-foreground">Claude 3.7 Sonnet (Hybrid)</span>
                <span className="font-mono text-muted-foreground">58%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '58%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-medium text-foreground">OpenAI o3-mini (Reasoning)</span>
                <span className="font-mono text-muted-foreground">28%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-medium text-foreground">Sequential Synthesis Core</span>
                <span className="font-mono text-muted-foreground">14%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '14%' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Panel 2: Live Webhooks & Event Delivery */}
        <Card className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Webhook className="h-3.5 w-3.5 text-primary" />
              Webhook Endpoints
            </span>
            <Link to="/dashboard/webhooks" className="text-[10px] text-primary hover:underline font-semibold">
              Manage
            </Link>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/30 border border-border/60">
              <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] truncate">api.company.com/events</span>
              </div>
              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-0">
                200 OK
              </Badge>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/30 border border-border/60">
              <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] truncate">hooks.slack.com/services</span>
              </div>
              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-0">
                200 OK
              </Badge>
            </div>

            <p className="text-[10px] text-muted-foreground pt-0.5">
              3 active endpoints · 99.98% delivery rate past 24h
            </p>
          </div>
        </Card>

        {/* Panel 3: Active Production API Key & Quickstart */}
        <Card className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              Active API Key
            </span>
            <Link to="/dashboard/api-keys" className="text-[10px] text-primary hover:underline font-semibold">
              View All
            </Link>
          </div>

          <div className="p-2 rounded-lg bg-muted/40 border border-border/70 flex items-center justify-between">
            <span className="font-mono text-[11px] text-foreground">sk_live_seq_••••8f9a</span>
            <button
              type="button"
              onClick={handleCopyKey}
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1"
              title="Copy API Key"
            >
              {copiedKey ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>Rate Limit: 1,000 req/min</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">ACTIVE</span>
          </div>
        </Card>
      </div>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Create New Task Pipeline
            </DialogTitle>
            <DialogDescription className="text-xs">
              Execute multi-agent research with automated citations and synthesis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-3 mt-2">
            <Textarea
              placeholder="Ask any question, market synthesis, or structured analysis..."
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              rows={4}
              className="resize-none text-xs rounded-xl p-3"
              required
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewTaskOpen(false)}
                className="rounded text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || !newPrompt.trim()}
                className="rounded text-xs font-bold text-white shadow-xs flex items-center gap-1.5 font-mono"
                style={{ background: 'var(--primary, #F2541B)' }}
              >
                {isCreating ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    DISPATCHING...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    RUN TASK
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </Skeleton>
  )
}
