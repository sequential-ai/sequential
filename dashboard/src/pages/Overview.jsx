import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/StatusBadge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import {
  Plus,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  KeyRound,
  Zap,
  Clock,
  Activity,
  CheckCircle2,
  Copy,
  Check,
  Code2,
} from 'lucide-react'
import { mockUsageData } from '@/lib/mock'

const RECENT_TASKS = [
  {
    id: 'tsk_9f83a1b2',
    prompt: 'Comprehensive market analysis for enterprise agentic AI architectures in 2026',
    status: 'COMPLETED',
    duration: '4.2s',
    tokens: 42800,
    cost: 0.0428,
    workerCount: 6,
    createdAt: '10 mins ago',
  },
  {
    id: 'tsk_7e62c4d8',
    prompt: 'Synthesize cross-border regulatory compliance guidelines for FinTech AI deployment',
    status: 'RUNNING',
    duration: '1.8s',
    tokens: 18400,
    cost: 0.0184,
    workerCount: 4,
    createdAt: '25 mins ago',
  },
  {
    id: 'tsk_3b19f0a4',
    prompt: 'Benchmarking latency and token efficiency across Claude 3.7 Sonnet vs OpenAI o3-mini',
    status: 'COMPLETED',
    duration: '3.1s',
    tokens: 68100,
    cost: 0.0681,
    workerCount: 8,
    createdAt: '2 hours ago',
  },
  {
    id: 'tsk_1a4d8c2e',
    prompt: 'Evaluate small-molecule oncological target candidates from PubMed literature',
    status: 'COMPLETED',
    duration: '5.4s',
    tokens: 54000,
    cost: 0.0540,
    workerCount: 7,
    createdAt: '5 hours ago',
  },
]

const WORKER_DISTRIBUTION = [
  { name: 'Search Workers', value: 45, color: '#F2541B' },
  { name: 'Synthesis Engine', value: 30, color: '#C23DBE' },
  { name: 'Verification & QA', value: 15, color: '#6B3DFF' },
  { name: 'Planning & DAG', value: 10, color: '#CFF23A' },
]

const chartConfig = {
  requests: { label: 'Pipeline Runs', color: '#F2541B' },
  input: { label: 'Prompt Tokens', color: '#6B3DFF' },
  output: { label: 'Completion Tokens', color: '#C23DBE' },
}

export default function Overview() {
  const { dbUser, org, credits, apiKeys, syncStatus } = useAuth()
  const navigate = useNavigate()
  const [copiedCode, setCopiedCode] = useState(false)

  const activeKey = apiKeys?.[0]?.keyPrefix ? `${apiKeys[0].keyPrefix}••••••••` : 'seq_live_demo_key'

  const curlCode = `curl -X POST http://localhost:5000/api/v1/tasks \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${activeKey}" \\
  -d '{
    "prompt": "Deep research on agentic AI architectures",
    "depth": "deep",
    "verifySources": true,
    "maxWorkers": 6
  }'`

  const pythonCode = `import sequential

client = sequential.Client(api_key="${activeKey}")

task = client.tasks.create(
    prompt="Deep research on agentic AI architectures",
    depth="deep",
    verify_sources=True,
    max_workers=6
)

print(f"Task dispatched: {task.id}")
report = task.wait_for_completion()
print(report.markdown)`

  const nodeCode = `import { Sequential } from '@sequential-ai/sdk';

const client = new Sequential({ apiKey: '${activeKey}' });

const task = await client.tasks.create({
  prompt: 'Deep research on agentic AI architectures',
  depth: 'deep',
  verifySources: true,
  maxWorkers: 6
});

console.log('Synthesized Report:', await task.result());`

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
              {org?.name || 'Sequential Workspace'}
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline font-mono">
              • {syncStatus}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Welcome back, {dbUser?.firstName || 'Researcher'}
          </h1>
          <p className="text-xs text-muted-foreground max-w-xl">
            Autonomous multi-agent research pipelines are active. 6 parallel workers ready for orchestration.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <Button
            onClick={() => navigate('/dashboard/tasks?new=true')}
            className="rounded-lg h-8 px-3.5 text-xs font-semibold text-white shadow-xs"
            style={{ background: 'var(--primary)' }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Launch Deep Research
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/api-keys')}
            className="rounded-lg h-8 px-3 text-xs gap-1.5"
          >
            <KeyRound className="h-3.5 w-3.5" />
            API Keys
          </Button>
        </div>

        <div
          className="absolute -right-20 -top-20 w-56 h-56 rounded-full opacity-10 pointer-events-none blur-3xl"
          style={{ background: 'var(--seq-grad)' }}
        />
      </div>

      {/* KPI Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Executions
            </span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">1,428</span>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20 px-1 py-0 font-mono">
              +14.2%
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Queries processed</p>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Token Volume
            </span>
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
              <Cpu className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">1.82M</span>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20 px-1 py-0 font-mono">
              99.2% prompt
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Multi-model ingestion</p>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Avg Turnaround
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">3.4s</span>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20 px-1 py-0 font-mono">
              -0.8s
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Parallel search latency</p>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Available Credits
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Zap className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {credits.toLocaleString()}
            </span>
            <Link to="/dashboard/billing" className="text-[11px] text-primary hover:underline">
              Top up
            </Link>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Developer Pro tier</p>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Token Throughput Area Chart */}
        <Card className="lg:col-span-2 rounded-xl border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <div>
              <CardTitle className="text-sm font-bold">Research Pipeline Telemetry</CardTitle>
              <CardDescription className="text-xs">Daily token consumption & completion volume</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">Last 30 Days</Badge>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={mockUsageData.tokensChart}>
                <defs>
                  <linearGradient id="seqOverviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2541B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F2541B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={6} fontSize={10} interval={5} />
                <YAxis tickLine={false} axisLine={false} tickMargin={6} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="output"
                  stroke="#F2541B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#seqOverviewGrad)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Worker Node Distribution Donut */}
        <Card className="rounded-xl border-border bg-card shadow-xs">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold">Worker Concurrency</CardTitle>
            <CardDescription className="text-xs">Inference load across sub-agents</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex flex-col items-center justify-center">
            <div className="h-[140px] w-[140px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={WORKER_DISTRIBUTION} innerRadius={45} outerRadius={62} paddingAngle={3} dataKey="value">
                    {WORKER_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold font-mono">100%</span>
                <span className="text-[9px] text-muted-foreground uppercase">Load</span>
              </div>
            </div>

            <div className="w-full space-y-1.5 mt-2">
              {WORKER_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground text-[11px] truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Research Tasks Table */}
      <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <CardTitle className="text-sm font-bold">Recent Research Tasks</CardTitle>
            <CardDescription className="text-xs">Live execution trace and output status</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-lg text-xs h-7 gap-1">
            <Link to="/dashboard/tasks">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 uppercase text-muted-foreground font-medium text-[10px]">
                  <th className="py-2.5 px-4">Task ID</th>
                  <th className="py-2.5 px-4">Research Objective</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Latency</th>
                  <th className="py-2.5 px-4">Tokens</th>
                  <th className="py-2.5 px-4">Cost</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT_TASKS.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-foreground">
                      <Link to={`/dashboard/tasks/${task.id}`} className="hover:text-primary transition-colors">
                        {task.id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 max-w-sm truncate text-foreground font-medium">
                      {task.prompt}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-2.5 px-4 font-mono text-muted-foreground">
                      {task.duration}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-muted-foreground">
                      {task.tokens.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-emerald-400 font-semibold">
                      ${task.cost.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button asChild variant="ghost" size="xs" className="rounded-md h-6 text-[11px]">
                        <Link to={`/dashboard/tasks/${task.id}`}>Inspect</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Developer API Quickstart */}
      <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border bg-muted/10">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-sm font-bold">SDK & API Integration</CardTitle>
              <CardDescription className="text-xs">Dispatch research tasks programmatically</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleCopyCode(curlCode)}
            className="rounded-md h-7 text-xs gap-1 cursor-pointer"
          >
            {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copiedCode ? 'Copied' : 'Copy'}
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="rounded-lg bg-muted/40 p-0.5 mb-3 h-7">
              <TabsTrigger value="curl" className="rounded-md text-[11px] h-6 px-2.5">cURL</TabsTrigger>
              <TabsTrigger value="python" className="rounded-md text-[11px] h-6 px-2.5">Python SDK</TabsTrigger>
              <TabsTrigger value="node" className="rounded-md text-[11px] h-6 px-2.5">Node.js / TypeScript</TabsTrigger>
            </TabsList>

            <TabsContent value="curl">
              <pre className="p-3.5 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-zinc-800">
                <code>{curlCode}</code>
              </pre>
            </TabsContent>

            <TabsContent value="python">
              <pre className="p-3.5 rounded-lg bg-zinc-950 text-blue-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-zinc-800">
                <code>{pythonCode}</code>
              </pre>
            </TabsContent>

            <TabsContent value="node">
              <pre className="p-3.5 rounded-lg bg-zinc-950 text-amber-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-zinc-800">
                <code>{nodeCode}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
