import React from 'react'
import { Card } from '@/components/ui/card'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
} from 'lucide-react'

export function ExecutionIdleState() {
  return (
    <Card className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xs min-h-[380px] flex flex-col items-center justify-center text-center space-y-5">
      {/* Node Graphic */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
          <Layers className="h-7 w-7 text-primary" />
        </div>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-base font-bold text-foreground">
          Autonomous Execution Workspace
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Submit a task above or select an example prompt to dispatch Sequential's parallel agent pipeline.
        </p>
      </div>

      {/* Visual Execution Flow Preview */}
      <div className="w-full max-w-lg p-3 rounded-lg bg-muted/20 border border-border/70 text-[11px] font-mono text-muted-foreground flex items-center justify-between gap-1 overflow-x-auto">
        <span className="font-semibold text-foreground">Intent</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        <span>Planning</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        <span className="text-primary font-semibold">Execution</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        <span>Validation</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Structured Output</span>
      </div>

      {/* Feature Micro-Badges */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Zero Hallucination DAG
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Globe className="h-3.5 w-3.5 text-primary" /> Live Citation Search
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-primary" /> Sub-second Latency
        </span>
      </div>
    </Card>
  )
}
