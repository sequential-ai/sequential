import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock, Loader2, Sparkles, Ban } from 'lucide-react'

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground border-border',
    icon: Clock,
    pulse: false,
  },
  PLANNING: {
    label: 'Planning',
    className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon: Loader2,
    pulse: true,
  },
  RUNNING: {
    label: 'Running',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Loader2,
    pulse: true,
  },
  SYNTHESIZING: {
    label: 'Synthesizing',
    className: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    icon: Sparkles,
    pulse: true,
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-lime-500/15 text-lime-400 border-lime-500/30 font-medium',
    icon: CheckCircle2,
    pulse: false,
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    icon: XCircle,
    pulse: false,
  },
  CANCELED: {
    label: 'Canceled',
    className: 'bg-muted text-muted-foreground border-border',
    icon: Ban,
    pulse: false,
  },
  ACTIVE: {
    label: 'Active',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
    pulse: false,
  },
  REVOKED: {
    label: 'Revoked',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: Ban,
    pulse: false,
  },
}

export function StatusBadge({ status = 'PENDING', className }) {
  const normalized = (status || 'PENDING').toUpperCase()
  const config = STATUS_CONFIG[normalized] || {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
    icon: Clock,
    pulse: false,
  }
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border shadow-none transition-colors',
        config.className,
        className
      )}
    >
      {config.pulse ? (
        <Icon className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      <span>{config.label}</span>
    </Badge>
  )
}
