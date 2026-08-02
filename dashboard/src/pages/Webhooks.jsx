import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Webhook as WebhookIcon,
  RotateCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Info,
  ExternalLink,
  Plus,
  Trash2,
  Send,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

const INITIAL_ENDPOINTS = [
  {
    id: 'ep_1',
    url: 'https://api.mycompany.com/v1/sequential/events',
    events: ['task.completed', 'task.failed'],
    status: 'ACTIVE',
    createdAt: '2026-07-28',
  },
]

const INITIAL_DELIVERIES = [
  {
    id: 'del_9821',
    event: 'task.completed',
    endpoint: 'https://api.mycompany.com/v1/sequential/events',
    status: 200,
    latency: '142ms',
    timestamp: '2 mins ago',
  },
  {
    id: 'del_9820',
    event: 'task.started',
    endpoint: 'https://api.mycompany.com/v1/sequential/events',
    status: 200,
    latency: '98ms',
    timestamp: '15 mins ago',
  },
  {
    id: 'del_9819',
    event: 'task.failed',
    endpoint: 'https://api.mycompany.com/v1/sequential/events',
    status: 500,
    latency: '310ms',
    timestamp: '1 hour ago',
  },
]

export default function Webhooks() {
  const [secret, setSecret] = useState('whsec_7f9a2b84c6e1d350a21')
  const [showSecret, setShowSecret] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false)

  // Endpoints & Modals
  const [endpoints, setEndpoints] = useState(INITIAL_ENDPOINTS)
  const [isAddEndpointOpen, setIsAddEndpointOpen] = useState(false)
  const [newEndpointUrl, setNewEndpointUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState(['task.completed', 'task.failed'])
  const [pingSuccess, setPingSuccess] = useState(null)

  // Copy secret handler
  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  // Refresh secret
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 500)
  }

  // Confirm regenerate secret
  const handleRegenerateSecret = () => {
    const chars = '0123456789abcdef'
    let newHex = ''
    for (let i = 0; i < 16; i++) {
      newHex += chars[Math.floor(Math.random() * chars.length)]
    }
    setSecret(`whsec_${newHex}0a21`)
    setIsRegenerateOpen(false)
  }

  // Add new endpoint
  const handleAddEndpoint = (e) => {
    e.preventDefault()
    if (!newEndpointUrl.trim()) return

    const newEp = {
      id: `ep_${Date.now()}`,
      url: newEndpointUrl.trim(),
      events: selectedEvents.length > 0 ? selectedEvents : ['task.completed'],
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    }

    setEndpoints([...endpoints, newEp])
    setNewEndpointUrl('')
    setIsAddEndpointOpen(false)
  }

  // Remove endpoint
  const handleRemoveEndpoint = (id) => {
    setEndpoints(endpoints.filter((ep) => ep.id !== id))
  }

  // Test Ping Endpoint
  const handleTestPing = (url) => {
    setPingSuccess(url)
    setTimeout(() => setPingSuccess(null), 3000)
  }

  const maskedSecret = showSecret
    ? secret
    : `${secret.slice(0, 6)}••••••••••••${secret.slice(-4)}`

  return (
    <div className="w-full space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Webhooks</h1>
      </div>

      {/* Top Documentation Banner */}
      <div className="rounded-xl border border-border/80 bg-card p-4 flex items-center gap-3 text-xs text-muted-foreground shadow-2xs">
        <Info className="h-4 w-4 shrink-0 text-foreground/70" />
        <span>
          Learn how to use task webhooks in Sequential. See the{' '}
          <a
            href="https://docs.sequential.ai/webhooks"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline text-foreground hover:text-primary transition-colors inline-flex items-center gap-0.5"
          >
            Webhooks Documentation
          </a>{' '}
          for more information.
        </span>
      </div>

      {/* Webhooks Beta Section (Active Secret) */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">Webhooks</h2>
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-semibold uppercase bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/60 px-2 py-0.2"
            >
              BETA
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-lg h-8 px-3 text-xs font-semibold text-foreground border-border/80 hover:bg-muted cursor-pointer flex items-center gap-1.5 uppercase font-mono tracking-wider"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            REFRESH
          </Button>
        </div>

        {/* Secret Input / Row Box */}
        <div className="rounded-xl border border-border/70 bg-muted/20 dark:bg-zinc-900/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-mono text-xs font-semibold text-foreground tracking-wide select-all">
            {maskedSecret}
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopySecret}
              title="Copy Secret"
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {copiedSecret ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            {/* Reveal / Hide Toggle */}
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              title={showSecret ? 'Hide secret' : 'Reveal secret'}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>

            {/* Active Secret status */}
            <span className="text-xs font-medium text-muted-foreground pl-1">
              Active Secret
            </span>
          </div>
        </div>
      </Card>

      {/* Regenerate Secret Section */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-foreground">Regenerate Secret</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Regenerating your webhook signing secret will immediately invalidate the current secret and all subsequent payload verifications will require the new secret.
          </p>
        </div>

        <div>
          <Button
            size="sm"
            onClick={() => setIsRegenerateOpen(true)}
            className="rounded-lg h-8 px-4 text-xs font-bold uppercase text-white dark:text-zinc-900 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 shadow-xs cursor-pointer font-mono tracking-wide"
          >
            GENERATE NEW SECRET
          </Button>
        </div>
      </Card>

      {/* Webhook Endpoints Section */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Registered Endpoints</h2>
            <p className="text-xs text-muted-foreground">HTTP POST destinations receiving real-time task lifecycle payloads.</p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddEndpointOpen(true)}
            className="rounded-lg h-8 px-3 text-xs text-white font-semibold shadow-xs"
            style={{ background: 'var(--primary)' }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Endpoint
          </Button>
        </div>

        {endpoints.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl space-y-2">
            <WebhookIcon className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">No webhook endpoints configured yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="p-3.5 rounded-xl border border-border/70 bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground truncate">
                      {ep.url}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono">
                      {ep.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {ep.events.map((evt) => (
                      <span
                        key={evt}
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground"
                      >
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {pingSuccess === ep.url ? (
                    <span className="text-xs text-emerald-500 font-mono flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 200 OK
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestPing(ep.url)}
                      className="rounded-lg h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Test Ping
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveEndpoint(ep.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Deliveries Table */}
      <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs space-y-0">
        <div className="p-4 border-b border-border/70">
          <h2 className="text-sm font-bold text-foreground">Recent Deliveries</h2>
          <p className="text-xs text-muted-foreground">Log of the most recent webhook HTTP POST dispatches.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/70 text-[11px] font-mono font-medium text-muted-foreground/80 bg-muted/20">
                <th className="py-2.5 px-4 font-semibold">Event</th>
                <th className="py-2.5 px-4 font-semibold">Endpoint</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Latency</th>
                <th className="py-2.5 px-4 text-right font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {INITIAL_DELIVERIES.map((del) => (
                <tr key={del.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-foreground">
                    {del.event}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono truncate max-w-xs">
                    {del.endpoint}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        del.status === 200
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}
                    >
                      {del.status} {del.status === 200 ? 'OK' : 'Error'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{del.latency}</td>
                  <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                    {del.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold text-foreground">
                Regenerate Webhook Secret?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to regenerate your webhook secret? Your current secret will be immediately revoked and any incoming webhook signature verifications will fail until updated.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRegenerateOpen(false)}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRegenerateSecret}
              className="rounded-lg text-xs text-white bg-destructive hover:bg-destructive/90 shadow-xs font-semibold"
            >
              Yes, Regenerate Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Endpoint Dialog */}
      <Dialog open={isAddEndpointOpen} onOpenChange={setIsAddEndpointOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Webhook Endpoint</DialogTitle>
            <DialogDescription className="text-xs">
              Provide an HTTPS URL that will receive signed JSON POST payloads.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddEndpoint} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ep-url" className="text-xs font-semibold">Endpoint URL</Label>
              <Input
                id="ep-url"
                placeholder="https://api.yourdomain.com/v1/sequential"
                value={newEndpointUrl}
                onChange={(e) => setNewEndpointUrl(e.target.value)}
                className="rounded-lg h-8 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Subscribe to Events</Label>
              <div className="space-y-2">
                {[
                  { id: 'task.completed', label: 'task.completed (When a research task finishes)' },
                  { id: 'task.failed', label: 'task.failed (When a task encounters an error)' },
                  { id: 'step.progress', label: 'step.progress (Real-time agent execution step)' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents([...selectedEvents, item.id])
                        } else {
                          setSelectedEvents(selectedEvents.filter((ev) => ev !== item.id))
                        }
                      }}
                      className="rounded border-border text-primary"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddEndpointOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-lg text-xs text-white font-semibold shadow-xs"
                style={{ background: 'var(--primary)' }}
              >
                Save Endpoint
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
