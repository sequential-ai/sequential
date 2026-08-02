import React from 'react'
import { Check, Layers } from 'lucide-react'

export function ExecutionMap({ currentStepIndex = 0, isRunning = false, isCompleted = false, mode = 'STANDARD' }) {
  const getNodeState = (stepIdx) => {
    if (isCompleted) return 'completed'
    if (!isRunning) return 'idle'
    if (currentStepIndex > stepIdx) return 'completed'
    if (currentStepIndex === stepIdx) return 'active'
    return 'pending'
  }

  return (
    <div className="w-full rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-2xs font-mono select-none overflow-x-auto min-w-0">
      <div className="flex items-center justify-between pb-2 border-b border-border/50 text-[10px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Sequential Execution Map
        </span>
        <span className="text-[10px]">
          {isCompleted ? '✓ Pipeline Complete' : isRunning ? `Active Phase: ${currentStepIndex}/5` : 'Idle Graph'}
        </span>
      </div>

      {/* Connected Diagram View */}
      <div className="pt-3 pb-1 min-w-[540px] flex items-center justify-between relative px-2">
        {/* Step 1: Understand */}
        <div className="flex flex-col items-center gap-1 relative z-10">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              getNodeState(1) === 'completed'
                ? 'bg-primary text-white ring-2 ring-primary/20'
                : getNodeState(1) === 'active'
                ? 'bg-primary text-white animate-pulse ring-4 ring-primary/30'
                : 'bg-muted/70 text-muted-foreground border border-border/80'
            }`}
          >
            {getNodeState(1) === 'completed' ? <Check className="h-3 w-3" /> : '1'}
          </div>
          <span className={`text-[10px] font-medium ${getNodeState(1) === 'active' ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
            Understand
          </span>
        </div>

        {/* Connector 1 -> 2 */}
        <div className="flex-1 h-[2px] mx-1 bg-border/80 relative overflow-hidden">
          {(getNodeState(1) === 'completed' || isCompleted) && (
            <div className="absolute inset-0 bg-primary transition-all duration-500" />
          )}
          {getNodeState(1) === 'active' && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary animate-pulse" />
          )}
        </div>

        {/* Step 2: Plan */}
        <div className="flex flex-col items-center gap-1 relative z-10">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              getNodeState(2) === 'completed'
                ? 'bg-primary text-white ring-2 ring-primary/20'
                : getNodeState(2) === 'active'
                ? 'bg-primary text-white animate-pulse ring-4 ring-primary/30'
                : 'bg-muted/70 text-muted-foreground border border-border/80'
            }`}
          >
            {getNodeState(2) === 'completed' ? <Check className="h-3 w-3" /> : '2'}
          </div>
          <span className={`text-[10px] font-medium ${getNodeState(2) === 'active' ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
            Plan DAG
          </span>
        </div>

        {/* Connector 2 -> 3 */}
        <div className="flex-1 h-[2px] mx-1 bg-border/80 relative overflow-hidden">
          {(getNodeState(2) === 'completed' || isCompleted) && (
            <div className="absolute inset-0 bg-primary transition-all duration-500" />
          )}
          {getNodeState(2) === 'active' && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary animate-pulse" />
          )}
        </div>

        {/* Step 3: Parallel Execution Cluster */}
        <div className="flex flex-col items-center gap-1 relative z-10">
          <div
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all border ${
              getNodeState(3) === 'completed'
                ? 'bg-primary/10 text-primary border-primary/40 ring-1 ring-primary/20'
                : getNodeState(3) === 'active'
                ? 'bg-primary text-white border-primary shadow-xs animate-pulse ring-4 ring-primary/20'
                : 'bg-muted/40 text-muted-foreground border-border/80'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Research ({mode === 'DEEP' ? '6' : mode === 'STANDARD' ? '4' : '2'} Workers)</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
            <span>Search</span>
            <span>·</span>
            <span>Extract</span>
            <span>·</span>
            <span>Analyze</span>
          </div>
        </div>

        {/* Connector 3 -> 4 */}
        <div className="flex-1 h-[2px] mx-1 bg-border/80 relative overflow-hidden">
          {(getNodeState(3) === 'completed' || isCompleted) && (
            <div className="absolute inset-0 bg-primary transition-all duration-500" />
          )}
          {getNodeState(3) === 'active' && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary animate-pulse" />
          )}
        </div>

        {/* Step 4: Synthesize */}
        <div className="flex flex-col items-center gap-1 relative z-10">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              getNodeState(4) === 'completed'
                ? 'bg-primary text-white ring-2 ring-primary/20'
                : getNodeState(4) === 'active'
                ? 'bg-primary text-white animate-pulse ring-4 ring-primary/30'
                : 'bg-muted/70 text-muted-foreground border border-border/80'
            }`}
          >
            {getNodeState(4) === 'completed' ? <Check className="h-3 w-3" /> : '4'}
          </div>
          <span className={`text-[10px] font-medium ${getNodeState(4) === 'active' ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
            Synthesize
          </span>
        </div>

        {/* Connector 4 -> 5 */}
        <div className="flex-1 h-[2px] mx-1 bg-border/80 relative overflow-hidden">
          {(getNodeState(4) === 'completed' || isCompleted) && (
            <div className="absolute inset-0 bg-primary transition-all duration-500" />
          )}
          {getNodeState(4) === 'active' && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary animate-pulse" />
          )}
        </div>

        {/* Step 5: Validate */}
        <div className="flex flex-col items-center gap-1 relative z-10">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              getNodeState(5) === 'completed'
                ? 'bg-primary text-white ring-2 ring-primary/20'
                : getNodeState(5) === 'active'
                ? 'bg-primary text-white animate-pulse ring-4 ring-primary/30'
                : 'bg-muted/70 text-muted-foreground border border-border/80'
            }`}
          >
            {getNodeState(5) === 'completed' ? <Check className="h-3 w-3" /> : '5'}
          </div>
          <span className={`text-[10px] font-medium ${getNodeState(5) === 'active' ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
            Validate
          </span>
        </div>

        {/* Connector 5 -> 6 */}
        <div className="flex-1 h-[2px] mx-1 bg-border/80 relative overflow-hidden">
          {(getNodeState(5) === 'completed' || isCompleted) && (
            <div className="absolute inset-0 bg-primary transition-all duration-500" />
          )}
          {getNodeState(5) === 'active' && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary animate-pulse" />
          )}
        </div>

        {/* Step 6: Output Terminal Diamond ◆ */}
        <div className="flex flex-col items-center gap-1 relative z-10">
          <div
            className={`w-6 h-6 rotate-45 flex items-center justify-center text-[10px] font-bold transition-all ${
              isCompleted
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-500/20'
                : 'bg-muted/70 text-muted-foreground border border-border/80'
            }`}
          >
            <span className="-rotate-45 font-mono text-[9px]">{isCompleted ? '✓' : '◆'}</span>
          </div>
          <span className={`text-[10px] font-medium ${isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
            Output
          </span>
        </div>
      </div>
    </div>
  )
}
