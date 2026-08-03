import React, { useState } from 'react'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Settings as SettingsIcon,
  Key,
  Webhook,
  Shield,
  Save,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react'

function SettingsFallback() {
  return (
    <div className="w-full space-y-6 p-1">
      <div className="space-y-1.5">
        <UiSkeleton className="h-7 w-48 rounded-lg" />
        <UiSkeleton className="h-4 w-96 rounded-md" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-xl border border-border/80 bg-card space-y-3">
            <UiSkeleton className="h-5 w-40 rounded" />
            <UiSkeleton className="h-4 w-64 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <UiSkeleton className="h-9 w-full rounded-lg" />
              <UiSkeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Settings() {
  const { org, isSyncing } = useAuth()
  const [orgName, setOrgName] = useState(org?.name || "Yash's Workspace")
  const [defaultDepth, setDefaultDepth] = useState('deep')
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [firecrawlKey, setFirecrawlKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <Skeleton
      name="settings-page"
      loading={isSyncing}
      fallback={<SettingsFallback />}
      className="w-full min-w-0"
    >
      <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure workspace metadata, custom LLM provider credentials (BYOK), and webhook endpoints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Workspace Identity Card */}
        <Card className="rounded-xl border-border bg-card shadow-xs">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-bold">General Workspace Identity</CardTitle>
            <CardDescription className="text-xs">Basic attributes identifying your research team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="org-name" className="text-xs font-semibold">Workspace Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="rounded-lg h-8 text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="default-depth" className="text-xs font-semibold">Default Research Depth</Label>
                <Select value={defaultDepth} onValueChange={setDefaultDepth}>
                  <SelectTrigger id="default-depth" className="rounded-lg h-8 text-xs bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast (1-2 Workers)</SelectItem>
                    <SelectItem value="balanced">Balanced (4 Workers)</SelectItem>
                    <SelectItem value="deep">Deep Research (6 Workers)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BYOK (Bring Your Own Key) Custom Providers */}
        <Card className="rounded-xl border-border bg-card shadow-xs">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <div>
                <CardTitle className="text-sm font-bold">Custom LLM Keys (BYOK)</CardTitle>
                <CardDescription className="text-xs">
                  Optionally route multi-agent reasoning tasks to your own provider accounts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="openai" className="text-xs font-semibold flex items-center justify-between">
                <span>OpenAI API Key (for o3-mini & GPT-4o)</span>
                <span className="text-[10px] text-muted-foreground font-mono">sk-••••••••</span>
              </Label>
              <Input
                id="openai"
                type="password"
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="rounded-lg h-8 text-xs font-mono bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anthropic" className="text-xs font-semibold flex items-center justify-between">
                <span>Anthropic API Key (for Claude 3.7 Sonnet)</span>
                <span className="text-[10px] text-muted-foreground font-mono">sk-ant-••••••••</span>
              </Label>
              <Input
                id="anthropic"
                type="password"
                placeholder="sk-ant-api03-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="rounded-lg h-8 text-xs font-mono bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="firecrawl" className="text-xs font-semibold flex items-center justify-between">
                <span>Firecrawl API Key (for Deep Web Crawlers)</span>
                <span className="text-[10px] text-muted-foreground font-mono">fc-••••••••</span>
              </Label>
              <Input
                id="firecrawl"
                type="password"
                placeholder="fc-..."
                value={firecrawlKey}
                onChange={(e) => setFirecrawlKey(e.target.value)}
                className="rounded-lg h-8 text-xs font-mono bg-muted/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Card */}
        <Card className="rounded-xl border-border bg-card shadow-xs">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-violet-400" />
              <div>
                <CardTitle className="text-sm font-bold">Lifecycle Webhooks</CardTitle>
                <CardDescription className="text-xs">
                  Receive HTTP POST notifications whenever a research task finishes synthesis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="webhook" className="text-xs font-semibold">Endpoint URL</Label>
              <Input
                id="webhook"
                placeholder="https://api.yourdomain.com/webhooks/sequential"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="rounded-lg h-8 text-xs font-mono bg-muted/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 font-mono">
              <Check className="h-3.5 w-3.5" /> Workspace configurations saved
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Changes apply instantly across all worker instances.
            </span>
          )}

          <Button
            type="submit"
            size="sm"
            className="rounded text-xs h-8 px-4 font-semibold text-white cursor-pointer shadow-xs"
            style={{ background: 'var(--primary)' }}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
    </Skeleton>
  )
}
