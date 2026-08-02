import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import {
  Activity,
  Cpu,
  Coins,
  Layers,
  Sparkles,
  TrendingUp,
  Download,
} from 'lucide-react'
import { mockUsageData } from '@/lib/mock'

const MODEL_BREAKDOWN = [
  { name: 'OpenAI o3-mini', value: 48, color: '#F2541B' },
  { name: 'Claude 3.7 Sonnet', value: 32, color: '#6B3DFF' },
  { name: 'DeepSeek R1', value: 14, color: '#C23DBE' },
  { name: 'GPT-4o', value: 6, color: '#CFF23A' },
]

const WORKER_COST_BREAKDOWN = [
  { worker: 'Search Crawlers', cost: 18.40 },
  { worker: 'Synthesis Engine', cost: 14.20 },
  { worker: 'Verification QA', cost: 6.80 },
  { worker: 'DAG Planner', cost: 3.10 },
  { worker: 'Summarizer', cost: 2.30 },
]

const chartConfig = {
  input: { label: 'Prompt Tokens', color: '#F2541B' },
  output: { label: 'Completion Tokens', color: '#6B3DFF' },
  requests: { label: 'API Calls', color: '#C23DBE' },
}

export default function Usage() {
  const [timeframe, setTimeframe] = useState('30d')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Usage & Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time telemetry on token volumes, model distribution, latency, and cost efficiency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 rounded-lg bg-card border-border h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="xs" className="rounded-lg h-8 text-xs gap-1">
            <Download className="h-3 w-3" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Token Ingestion</span>
            <Cpu className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">1.82M</span>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20 px-1 py-0 font-mono">+18%</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Prompt & context tokens</p>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Synthesis Output</span>
            <Layers className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">642k</span>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20 px-1 py-0 font-mono">+9%</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Completion tokens generated</p>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Total Incurred Cost</span>
            <Coins className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">$44.80</span>
            <span className="text-[10px] text-muted-foreground">/ $100 cap</span>
          </div>
          <Progress value={44.8} className="h-1 mt-2 rounded-full" />
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase">Avg Query Speed</span>
            <Activity className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">3.4s</span>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20 px-1 py-0 font-mono">Fast</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Parallel worker turnaround</p>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Token Volume Area Chart */}
        <Card className="lg:col-span-2 rounded-xl border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <div>
              <CardTitle className="text-sm font-bold">Token Consumption Breakdown</CardTitle>
              <CardDescription className="text-xs">Prompt context vs completion generation</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">Daily</Badge>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={mockUsageData.tokensChart}>
                <defs>
                  <linearGradient id="seqUsageGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2541B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F2541B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="seqUsageGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B3DFF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6B3DFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={6} fontSize={10} interval={4} />
                <YAxis tickLine={false} axisLine={false} tickMargin={6} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="input" stroke="#F2541B" strokeWidth={2} fillOpacity={1} fill="url(#seqUsageGrad1)" />
                <Area type="monotone" dataKey="output" stroke="#6B3DFF" strokeWidth={2} fillOpacity={1} fill="url(#seqUsageGrad2)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Foundation Model Distribution */}
        <Card className="rounded-xl border-border bg-card shadow-xs">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold">Model Routing</CardTitle>
            <CardDescription className="text-xs">Inference distribution by provider</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex flex-col items-center justify-center">
            <div className="h-[135px] w-[135px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={MODEL_BREAKDOWN} innerRadius={42} outerRadius={58} paddingAngle={3} dataKey="value">
                    {MODEL_BREAKDOWN.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-bold font-mono">4 Models</span>
              </div>
            </div>

            <div className="w-full space-y-1.5 mt-2">
              {MODEL_BREAKDOWN.map((item) => (
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

      {/* Sub-Agent Cost Allocation Table */}
      <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border">
          <CardTitle className="text-sm font-bold">Sub-Agent Tier Spend Breakdown</CardTitle>
          <CardDescription className="text-xs">Cost generated per specialized DAG node type</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 uppercase text-muted-foreground font-medium text-[10px]">
                  <th className="py-2.5 px-4">Worker Node Type</th>
                  <th className="py-2.5 px-4">Relative Share</th>
                  <th className="py-2.5 px-4 text-right">Incurred Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {WORKER_COST_BREAKDOWN.map((row) => (
                  <tr key={row.worker} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-foreground">
                      {row.worker}
                    </td>
                    <td className="py-2.5 px-4 w-1/2">
                      <div className="flex items-center gap-3">
                        <Progress value={(row.cost / 44.8) * 100} className="h-1.5 flex-1 rounded-full" />
                        <span className="text-[11px] text-muted-foreground font-mono w-10">
                          {((row.cost / 44.8) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-400">
                      ${row.cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
