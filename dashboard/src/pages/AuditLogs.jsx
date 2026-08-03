import React, { useState } from 'react'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ScrollText,
  Search,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

const AUDIT_LOGS = [
  {
    id: 'aud_101',
    action: 'api_key.create',
    actor: 'Yash Tailor',
    ip: '192.168.1.45',
    resource: 'key_prod_01 ("Production Worker Key")',
    status: 'SUCCESS',
    timestamp: '2026-08-02T12:20:10Z',
  },
  {
    id: 'aud_102',
    action: 'task.dispatch',
    actor: 'Marcus Vance',
    ip: '104.28.19.82',
    resource: 'tsk_9f83a1b2 (Deep Research Pipeline)',
    status: 'SUCCESS',
    timestamp: '2026-08-02T12:30:14Z',
  },
  {
    id: 'aud_103',
    action: 'team.invite',
    actor: 'Yash Tailor',
    ip: '192.168.1.45',
    resource: 'sarah.chen@sequential.ai (ANALYST)',
    status: 'SUCCESS',
    timestamp: '2026-08-02T10:14:02Z',
  },
  {
    id: 'aud_104',
    action: 'billing.credit_refill',
    actor: 'Yash Tailor',
    ip: '192.168.1.45',
    resource: '10,000 Credits Grant ($15)',
    status: 'SUCCESS',
    timestamp: '2026-08-01T00:00:00Z',
  },
  {
    id: 'aud_105',
    action: 'auth.rate_limit_exceeded',
    actor: 'SDK Client (Unknown)',
    ip: '45.33.32.156',
    resource: '/api/v1/tasks (Rate limit blocked)',
    status: 'BLOCKED',
    timestamp: '2026-07-31T18:22:45Z',
  },
]

function AuditLogsFallback() {
  return (
    <div className="space-y-5 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1.5">
          <UiSkeleton className="h-7 w-48 rounded-lg" />
          <UiSkeleton className="h-4 w-96 rounded-md" />
        </div>
        <UiSkeleton className="h-8 w-32 rounded-lg" />
      </div>
      <UiSkeleton className="h-8 w-full max-w-sm rounded-lg" />
      <div className="p-4 rounded-xl border border-border/80 bg-card space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border/40">
          <UiSkeleton className="h-5 w-32 rounded" />
          <UiSkeleton className="h-4 w-48 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
            <div className="flex items-center gap-4">
              <UiSkeleton className="h-4 w-28 rounded" />
              <UiSkeleton className="h-5 w-24 rounded-md" />
              <UiSkeleton className="h-4 w-20 rounded" />
              <UiSkeleton className="h-4 w-48 rounded" />
            </div>
            <UiSkeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AuditLogs() {
  const { isSyncing } = useAuth()
  const [search, setSearch] = useState('')

  const filtered = AUDIT_LOGS.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Skeleton
      name="audit-logs-page"
      loading={isSyncing}
      fallback={<AuditLogsFallback />}
      className="w-full min-w-0"
    >
      <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Security & Audit Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable SOC2 compliance trace of all workspace actions, API key mutations, and access attempts.
          </p>
        </div>

        <Button variant="outline" size="xs" className="rounded h-8 text-xs gap-1">
          <Download className="h-3 w-3" /> Export Audit Trail
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter audit logs by action or actor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 rounded-lg text-xs bg-card border-border"
        />
      </div>

      {/* Logs Table */}
      <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border">
          <CardTitle className="text-sm font-bold">Activity Log Stream</CardTitle>
          <CardDescription className="text-xs">Chronological record of system mutations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 uppercase text-muted-foreground font-medium text-[10px]">
                  <th className="py-2.5 px-4">Timestamp (UTC)</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Target Resource</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-[11px] font-semibold text-foreground px-1.5 py-0.5 rounded-md bg-muted">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-foreground text-xs">{log.actor}</td>
                    <td className="py-2.5 px-4 text-muted-foreground text-[11px] max-w-xs truncate">
                      {log.resource}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-muted-foreground text-[11px]">{log.ip}</td>
                    <td className="py-2.5 px-4 text-right">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono px-1.5 py-0 ${
                          log.status === 'SUCCESS'
                            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                            : 'text-rose-400 border-rose-500/30 bg-rose-500/5'
                        }`}
                      >
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
    </Skeleton>
  )
}
