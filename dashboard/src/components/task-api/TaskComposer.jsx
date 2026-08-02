import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Globe,
  Plus,
  FileCode2,
  FileText,
  X,
} from 'lucide-react'

export const EXAMPLE_TASKS = [
  'Analyze recent trends in enterprise agent infrastructure',
  'Compare model latency and token efficiency',
  'Research regulatory requirements across multiple regions',
]

export function TaskComposer({
  prompt,
  setPrompt,
  onKeyDown,
  webResearchEnabled,
  setWebResearchEnabled,
  additionalContext,
  setAdditionalContext,
  isStructuredOutput,
  setIsStructuredOutput,
  disabled,
}) {
  const [showContextField, setShowContextField] = useState(false)

  return (
    <Card className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5 relative min-w-0 w-full transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
      {/* Composer Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-none bg-primary" />
            New Task
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            — Autonomous multi-agent pipeline
          </span>
        </div>

        <span className="text-[11px] font-mono text-muted-foreground">
          ⌘/Ctrl + Enter
        </span>
      </div>

      {/* Main Command Center Textarea */}
      <div className="relative">
        <Textarea
          placeholder="What should Sequential accomplish? (e.g., Research the leading AI coding platforms, compare their pricing and developer experience, and return the findings as structured data.)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={3}
          className="resize-none rounded-lg border border-border/60 bg-background/50 focus:bg-background text-xs sm:text-sm p-3 sm:p-3.5 leading-relaxed placeholder:text-muted-foreground/60 transition-all shadow-inner font-sans min-h-[90px]"
        />
      </div>

      {/* Optional Context Field (Expandable) */}
      {showContextField && (
        <div className="space-y-1.5 pt-1 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-primary" />
              Additional Context / Domain Guidelines
            </span>
            <button
              type="button"
              onClick={() => {
                setShowContextField(false)
                setAdditionalContext('')
              }}
              className="text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-0.5 cursor-pointer"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
          <Textarea
            placeholder="Paste system instructions, corporate policy boundaries, target personas, or custom benchmark URLs..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            rows={2}
            className="text-xs font-mono rounded-lg border border-border/60 bg-muted/20 p-2.5 resize-none placeholder:text-muted-foreground/50"
          />
        </div>
      )}

      {/* Contextual Action Toggles (Compact Controls) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* + Web Research Toggle */}
          <button
            type="button"
            onClick={() => setWebResearchEnabled(!webResearchEnabled)}
            className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              webResearchEnabled
                ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground border-border/70'
            }`}
          >
            <Globe className={`h-3 w-3 ${webResearchEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
            <span>Web Research</span>
            {webResearchEnabled && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5" />}
          </button>

          {/* + Add Context Toggle */}
          <button
            type="button"
            onClick={() => setShowContextField(!showContextField)}
            className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              showContextField || additionalContext.trim()
                ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground border-border/70'
            }`}
          >
            <Plus className="h-3 w-3" />
            <span>{showContextField ? 'Context Active' : 'Add Context'}</span>
          </button>

          {/* + Structured Output Toggle */}
          <button
            type="button"
            onClick={() => setIsStructuredOutput(!isStructuredOutput)}
            className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isStructuredOutput
                ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground border-border/70'
            }`}
          >
            <FileCode2 className={`h-3 w-3 ${isStructuredOutput ? 'text-primary' : 'text-muted-foreground'}`} />
            <span>Structured Output</span>
            {isStructuredOutput && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5" />}
          </button>
        </div>

        {/* Character & Intent status */}
        <div className="text-[11px] font-mono text-muted-foreground">
          {prompt.length > 0 ? `${prompt.length} chars` : 'Command mode'}
        </div>
      </div>

      {/* 3 Subtle Example Tasks */}
      <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">
          Examples:
        </span>
        {EXAMPLE_TASKS.map((example, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setPrompt(example)}
            disabled={disabled}
            className="text-[11px] px-2.5 py-1 rounded-md bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left truncate max-w-xs border border-border/50"
          >
            • {example}
          </button>
        ))}
      </div>
    </Card>
  )
}
