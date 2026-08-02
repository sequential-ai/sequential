import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  ExternalLink,
  Code2,
  Copy,
  Check,
} from 'lucide-react'

export function TaskHeader({ onOpenHistory, onOpenApiCode, historyCount = 3 }) {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false)

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('POST https://api.sequential.ai/v1/tasks')
    setCopiedEndpoint(true)
    setTimeout(() => setCopiedEndpoint(false), 2000)
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1 border-b border-border/60">
      {/* Left: Product Title, Subtitle, Supporting text & Endpoint badge */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Task API
          </h1>

          {/* Subtitle pill */}
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
            Turn intent into execution
          </span>

          {/* Monospace Endpoint Badge */}
          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted border border-border/80 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
            title="Click to copy endpoint URL"
          >
            <span className="font-bold text-primary">POST</span>
            <span>/v1/tasks</span>
            {copiedEndpoint ? (
              <Check className="h-3 w-3 text-emerald-500 ml-0.5" />
            ) : (
              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Run autonomous research and execution workflows through a single API.
        </p>
      </div>

      {/* Right: Quick Actions (History, Docs, API Code) */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* History Drawer Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenHistory}
          className="h-8 px-3 rounded-lg border-border/80 bg-card hover:bg-muted text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>History</span>
          {historyCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-muted font-mono text-[10px] text-foreground font-semibold">
              {historyCount}
            </span>
          )}
        </Button>

        {/* Documentation Link */}
        <a
          href="https://docs.sequential.ai"
          target="_blank"
          rel="noreferrer"
          className="h-8 px-3 rounded-lg border border-border/80 bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>Docs</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>

        {/* API Code CTA (Orange Accent) */}
        <Button
          size="sm"
          onClick={onOpenApiCode}
          className="h-8 px-3.5 rounded-lg text-xs font-bold text-white shadow-xs flex items-center gap-1.5 font-mono cursor-pointer"
          style={{ background: 'var(--primary, #F2541B)' }}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>&lt;/&gt; API Code</span>
        </Button>
      </div>
    </div>
  )
}
