import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Play,
  RotateCw,
  Zap,
  Cpu,
  Layers,
} from 'lucide-react'

const DEPTH_OPTIONS = [
  {
    id: 'FAST',
    label: 'Fast',
    description: 'Quick execution with minimal reasoning (sub-second synthesis).',
    workers: '2 workers',
    icon: Zap,
  },
  {
    id: 'STANDARD',
    label: 'Standard',
    description: 'Balanced research, multi-source extraction, and execution.',
    workers: '4 workers',
    icon: Cpu,
  },
  {
    id: 'DEEP',
    label: 'Deep',
    description: 'Multi-step research, parallel web agents, and deep citation validation.',
    workers: '6 workers',
    icon: Layers,
  },
]

export function ExecutionControlBar({
  mode,
  setMode,
  onExecute,
  isRunning,
  disabled,
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
        {/* Left: Execution Depth Selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase text-[11px]">
            Execution Depth:
          </span>

          <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-muted/30">
            {DEPTH_OPTIONS.map((opt) => {
              const isSelected = mode === opt.id
              const Icon = opt.icon

              return (
                <Tooltip key={opt.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setMode(opt.id)}
                      disabled={disabled}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-background text-primary shadow-2xs border border-border/60'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-3 w-3 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{opt.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs p-2 text-xs font-sans space-y-1">
                    <p className="font-semibold text-foreground flex items-center justify-between">
                      <span>{opt.label} Mode</span>
                      <span className="font-mono text-[10px] text-primary">{opt.workers}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Middle: Configuration Badges */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60">
            Sources: <strong className="text-foreground">Auto</strong>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60">
            Max steps: <strong className="text-foreground">Auto</strong>
          </span>
        </div>

        {/* Right: Primary Execute CTA Button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onExecute}
            disabled={disabled || isRunning}
            className="rounded-lg h-9 px-6 text-xs font-extrabold uppercase text-white shadow-xs cursor-pointer flex items-center gap-2 font-mono transition-transform active:scale-95"
            style={{ background: 'var(--primary, #F2541B)' }}
          >
            {isRunning ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>EXECUTING PIPELINE...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>EXECUTE TASK</span>
                <span className="opacity-80 text-[10px] ml-1 font-normal tracking-tight font-sans bg-black/20 px-1.5 py-0.5 rounded">
                  ⌘ ↵
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
