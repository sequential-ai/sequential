import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Search,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function HistoryDrawer({
  isOpen,
  onOpenChange,
  historyList,
  onSelectTask,
  onLoadToComposer,
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredHistory = historyList.filter(
    (item) =>
      item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-card border-l border-border/80">
        <SheetHeader className="p-4 border-b border-border/60 space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent Tasks
            </SheetTitle>
            <span className="text-[11px] font-mono text-muted-foreground">
              {historyList.length} total
            </span>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Restore past Task API execution traces and outputs.
          </SheetDescription>

          <div className="pt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter by prompt query or Task ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs rounded-lg bg-background/50 border-border/70"
              />
            </div>
          </div>
        </SheetHeader>

        {/* List of Tasks */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-border/40">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-xs text-muted-foreground">No matching tasks found</p>
            </div>
          ) : (
            filteredHistory.map((task) => (
              <div
                key={task.id}
                className="pt-2 first:pt-0 group hover:bg-muted/20 p-2.5 rounded-lg transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-foreground hover:text-primary transition-colors">
                    {task.id}
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono uppercase px-1.5 py-0">
                    {task.mode || 'FAST'}
                  </Badge>
                </div>

                <p className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed">
                  {task.query}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <span>{task.duration || '2.1s'}</span>
                    <span>·</span>
                    <span>{task.citationCount || task.output?.sources?.length || 3} sources</span>
                    <span>·</span>
                    <span>${task.cost ? task.cost.toFixed(4) : '0.0180'}</span>
                  </div>
                  <span>{task.createdAt || 'Recent'}</span>
                </div>

                {/* Quick actions for task */}
                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSelectTask(task)
                      onOpenChange(false)
                    }}
                    className="h-6 px-2 text-[10px] rounded font-mono cursor-pointer flex-1 justify-center"
                  >
                    View Output & Trace
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onLoadToComposer(task)
                      onOpenChange(false)
                    }}
                    className="h-6 px-2 text-[10px] rounded font-mono text-primary cursor-pointer hover:bg-primary/10"
                  >
                    Load Prompt
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
