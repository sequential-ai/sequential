import React from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'

export default function PlaygroundHistory({
    historyList,
    historySearch,
    setHistorySearch,
    navigate,
    setPrompt,
    setCurrentResult,
    setActiveView,
}) {
    return (
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
                        .map((item) => {
                            // Support both the new { run, output } envelope and old flat shape
                            const run = item.run
                            const status = run?.status ?? item.status
                            const mode = run?.mode ?? item.mode
                            const durationMs = run?.execution?.executionTimeMs
                            const durationLabel = durationMs != null ? `${(durationMs / 1000).toFixed(2)}s` : (item.duration ?? '—')
                            const tokens = run?.execution?.tokensUsed ?? item.tokens
                            const cost = run?.execution?.costTotal ?? item.cost
                            const createdAt = run?.created_at
                                ? new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : (item.createdAt ?? '—')

                            return (
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
                                                {mode}
                                            </Badge>
                                            <StatusBadge status={status} />
                                        </div>
                                        <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-1">{item.query}</p>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{durationLabel}</span>
                                        <span>{tokens != null ? tokens.toLocaleString() : '—'} tok</span>
                                        <span>{cost != null ? `$${Number(cost).toFixed(4)}` : '—'}</span>
                                        <span>{createdAt}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const targetCat = item.category || 'task'
                                                navigate(`/dashboard/playground/${targetCat}/${item.id}`)
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
                            )
                        })}
                </div>
            </Card>
        </div>
    )
}
