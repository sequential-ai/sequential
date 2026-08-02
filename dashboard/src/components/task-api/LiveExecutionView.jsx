import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExecutionMap } from './ExecutionMap'
import {
  RotateCw,
  Clock,
  Sparkles,
  CheckCircle2,
  Layers,
  ChevronRight,
} from 'lucide-react'

export function LiveExecutionView({ mode = 'STANDARD', stepIndex = 1, currentStatus = '' }) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => +(prev + 0.1).toFixed(1))
    }, 100)
    return () => clearInterval(timer)
  }, [])

  const stepsList = [
    { id: 1, title: 'Understand task intent and constraints', phase: 'Intent & Extraction' },
    { id: 2, title: 'Formulate execution DAG strategy', phase: 'Planning' },
    {
      id: 3,
      title: `Dispatch ${mode === 'DEEP' ? '6' : mode === 'STANDARD' ? '4' : '2'} parallel research workers`,
      phase: 'Execution',
    },
    { id: 4, title: 'Synthesize cross-source evidence & eliminate contradictions', phase: 'Synthesis' },
    { id: 5, title: 'Validate output against TaskSpec schema', phase: 'Validation' },
  ]

  return (
    <Card className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4 min-h-[380px] flex flex-col justify-between">
      {/* Top Banner: Status + Timer */}
      <div className="space-y-3 pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/30 font-bold px-2 py-0.5 animate-pulse">
              ● RUNNING
            </Badge>
            <span className="text-xs font-mono text-foreground font-semibold">
              Autonomous Agent Orchestration
            </span>
          </div>

          {/* Stopwatch Elapsed */}
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary animate-spin" />
            <span className="font-bold text-foreground">{elapsedTime.toFixed(1)}s</span>
            <span className="text-[10px]">elapsed</span>
          </div>
        </div>

        {/* Dynamic Status Callout */}
        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-foreground font-mono">
            <RotateCw className="h-3.5 w-3.5 text-primary animate-spin" />
            <span className="text-xs font-medium">{currentStatus || 'Initializing agent pipeline...'}</span>
          </div>
          <span className="text-[10px] font-mono text-primary font-bold">
            {mode} Mode
          </span>
        </div>
      </div>

      {/* Signature Execution Map Graph */}
      <div className="py-1">
        <ExecutionMap
          currentStepIndex={stepIndex}
          isRunning={true}
          isCompleted={false}
          mode={mode}
        />
      </div>

      {/* Live Step-by-Step Progress Timeline */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
          Execution Timeline:
        </span>
        <div className="space-y-1.5 font-mono text-xs">
          {stepsList.map((step) => {
            const isDone = stepIndex > step.id
            const isCurrent = stepIndex === step.id
            const isUpcoming = stepIndex < step.id

            return (
              <div
                key={step.id}
                className={`p-2 rounded-lg border transition-all flex items-center justify-between text-xs ${
                  isCurrent
                    ? 'bg-primary/10 border-primary/40 text-foreground font-semibold shadow-2xs'
                    : isDone
                    ? 'bg-muted/30 border-border/60 text-muted-foreground'
                    : 'opacity-40 border-transparent text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <RotateCw className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                  )}
                  <span>
                    {step.id}. {step.title}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-muted-foreground">
                  {isDone ? 'Done' : isCurrent ? 'Active' : 'Pending'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>Worker Pool: Active</span>
        <span>Streaming event stream SSE...</span>
      </div>
    </Card>
  )
}
