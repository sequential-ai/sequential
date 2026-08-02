import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { useUser } from '@clerk/clerk-react'
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Settings,
  ExternalLink,
  Eye,
  EyeOff,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react'

const INITIAL_APPS = [
  {
    id: 'app_default',
    name: 'Default App',
    keys: [
      {
        id: '6da999fb-2163-486f-bcb7-44d0a6e40968',
        name: 'Default API Key',
        maskedValue: 'K - ****UZ5a',
        fullSecret: 'seq_live_9f83a1b2c3d4e5f67890123456789012',
        createdBy: 'yashtupkar6@gmail.com',
        createdAt: '7/10/2026',
        role: 'Full Access (Admin)',
      },
    ],
  },
]

export default function ApiKeys() {
  const { user } = useUser()
  const { dbUser } = useAuth()
  const userEmail = user?.primaryEmailAddress?.emailAddress || dbUser?.email || 'yashtupkar6@gmail.com'

  // Tab State: 'api_keys' | 'account_keys'
  const [activeTab, setActiveTab] = useState('api_keys')
  const [showKeyIds, setShowKeyIds] = useState(true)

  // App & Key Data
  const [apps, setApps] = useState(INITIAL_APPS)
  const [accountKeys, setAccountKeys] = useState([
    {
      id: 'acc_8812bf-41a2-4911-9a7c-1129aa51980',
      name: 'Root Organization Master Key',
      maskedValue: 'K - ****98A2',
      fullSecret: 'seq_root_8812bf41a249119a7c1129aa51980',
      createdBy: userEmail,
      createdAt: '7/01/2026',
      role: 'Root Admin',
    },
  ])

  // Revealed secrets state map
  const [revealedKeys, setRevealedKeys] = useState({})
  const [copiedKeyId, setCopiedKeyId] = useState(null)

  // Create Key Modal State
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState('app_default')
  const [newKeyName, setNewKeyName] = useState('')
  const [createdSecret, setCreatedSecret] = useState(null)
  const [copiedCreatedSecret, setCopiedCreatedSecret] = useState(false)

  // Create App Modal State
  const [isCreateAppModalOpen, setIsCreateAppModalOpen] = useState(false)
  const [newAppName, setNewAppName] = useState('')

  // Toggle reveal
  const toggleRevealKey = (keyId) => {
    setRevealedKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  // Copy secret
  const handleCopy = (text, keyId) => {
    navigator.clipboard.writeText(text)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  // Open Create Key modal for an app
  const handleOpenCreateKey = (appId) => {
    setSelectedAppId(appId)
    setNewKeyName('')
    setCreatedSecret(null)
    setIsCreateKeyModalOpen(true)
  }

  // Submit Create Key
  const handleCreateKeySubmit = (e) => {
    e.preventDefault()
    if (!newKeyName.trim()) return

    const randomSuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6)
    const generatedSecret = `seq_live_${randomSuffix}`
    const keyUuid = crypto.randomUUID ? crypto.randomUUID() : `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}`
    const last4 = randomSuffix.slice(-4).toUpperCase()

    const newKeyObj = {
      id: keyUuid,
      name: newKeyName,
      maskedValue: `K - ****${last4}`,
      fullSecret: generatedSecret,
      createdBy: userEmail,
      createdAt: new Date().toLocaleDateString('en-US'),
      role: 'Full Access',
    }

    if (activeTab === 'api_keys') {
      setApps((prevApps) =>
        prevApps.map((app) =>
          app.id === selectedAppId ? { ...app, keys: [...app.keys, newKeyObj] } : app
        )
      )
    } else {
      setAccountKeys((prev) => [...prev, newKeyObj])
    }

    setCreatedSecret(generatedSecret)
  }

  // Delete / Revoke key
  const handleRevokeKey = (appId, keyId) => {
    if (activeTab === 'api_keys') {
      setApps((prevApps) =>
        prevApps.map((app) =>
          app.id === appId ? { ...app, keys: app.keys.filter((k) => k.id !== keyId) } : app
        )
      )
    } else {
      setAccountKeys((prev) => prev.filter((k) => k.id !== keyId))
    }
  }

  // Submit Create App
  const handleCreateAppSubmit = (e) => {
    e.preventDefault()
    if (!newAppName.trim()) return

    const newApp = {
      id: `app_${Math.random().toString(36).substring(2, 8)}`,
      name: newAppName,
      keys: [],
    }

    setApps((prev) => [...prev, newApp])
    setNewAppName('')
    setIsCreateAppModalOpen(false)
  }

  // Delete App
  const handleDeleteApp = (appId) => {
    if (apps.length <= 1) {
      alert('You must have at least one application.')
      return
    }
    setApps((prev) => prev.filter((app) => app.id !== appId))
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">API Keys</h1>
      </div>

      {/* Navigation Tabs & View Key IDs Toggle Bar */}
      <div className="flex items-center justify-between border-b border-border/80 pb-0">
        {/* Tabs */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('api_keys')}
            className={`text-xs font-semibold pb-2.5 transition-colors cursor-pointer relative ${
              activeTab === 'api_keys'
                ? 'text-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            API Keys
            {activeTab === 'api_keys' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account_keys')}
            className={`text-xs font-semibold pb-2.5 transition-colors cursor-pointer relative ${
              activeTab === 'account_keys'
                ? 'text-foreground font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Account Keys
            {activeTab === 'account_keys' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        </div>

        {/* View Key IDs Switch */}
        <div className="flex items-center gap-2 pb-2.5">
          <Label htmlFor="view-key-ids" className="text-xs text-muted-foreground font-normal cursor-pointer select-none">
            View Key IDs
          </Label>
          <Switch
            id="view-key-ids"
            checked={showKeyIds}
            onCheckedChange={setShowKeyIds}
          />
        </div>
      </div>

      {/* Subheader: Description & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted-foreground">
          {activeTab === 'api_keys'
            ? 'Keys for building with the Sequential API, grouped by app. Create an app per product or environment.'
            : 'Management keys with elevated permissions across the entire organization.'}
        </p>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-lg h-8 px-3 text-xs font-mono uppercase tracking-wider font-semibold border-border/80 hover:bg-muted"
          >
            <a href="https://docs.sequential.ai" target="_blank" rel="noreferrer">
              API DOCS
              <ExternalLink className="h-3 w-3 ml-1.5" />
            </a>
          </Button>

          {activeTab === 'api_keys' && (
            <Button
              size="sm"
              onClick={() => setIsCreateAppModalOpen(true)}
              className="rounded-lg h-8 px-3.5 text-xs font-mono uppercase tracking-wider font-bold text-white shadow-xs"
              style={{ background: 'var(--primary)' }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              CREATE APP
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'api_keys' ? (
        <div className="space-y-6">
          {apps.map((app) => (
            <div key={app.id} className="space-y-2.5">
              {/* App Section Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">{app.name}</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="App Settings"
                    onClick={() => alert(`Settings for ${app.name}`)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Delete App"
                    onClick={() => handleDeleteApp(app.id)}
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Table Container Card */}
              <Card className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/70 text-[11px] font-mono font-medium text-muted-foreground/80 bg-muted/20">
                        <th className="py-2.5 px-4 font-mono font-semibold">API key name</th>
                        <th className="py-2.5 px-4 font-mono font-semibold">API key value</th>
                        <th className="py-2.5 px-4 font-mono font-semibold">Created by</th>
                        <th className="py-2.5 px-4 font-mono font-semibold">Created at</th>
                        {showKeyIds && (
                          <th className="py-2.5 px-4 font-mono font-semibold">Key ID</th>
                        )}
                        <th className="py-2.5 px-3 text-right font-mono font-semibold w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {app.keys.length === 0 ? (
                        <tr>
                          <td
                            colSpan={showKeyIds ? 6 : 5}
                            className="py-6 text-center text-xs text-muted-foreground"
                          >
                            No API keys generated in this app yet.
                          </td>
                        </tr>
                      ) : (
                        app.keys.map((key) => {
                          const isRevealed = revealedKeys[key.id]
                          const isCopied = copiedKeyId === key.id

                          return (
                            <tr key={key.id} className="hover:bg-muted/30 transition-colors group">
                              {/* API key name */}
                              <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                                {key.name}
                              </td>

                              {/* API key value */}
                              <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">
                                    {isRevealed ? key.fullSecret : key.maskedValue}
                                  </span>
                                  <button
                                    type="button"
                                    title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
                                    onClick={() => toggleRevealKey(key.id)}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="h-3.5 w-3.5" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    title="Copy Secret"
                                    onClick={() => handleCopy(key.fullSecret, key.id)}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  >
                                    {isCopied ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Created by */}
                              <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                {key.createdBy}
                              </td>

                              {/* Created at */}
                              <td className="py-3 px-4 text-muted-foreground font-mono whitespace-nowrap">
                                {key.createdAt}
                              </td>

                              {/* Key ID */}
                              {showKeyIds && (
                                <td className="py-3 px-4 font-mono text-[11px] text-foreground/90 whitespace-nowrap">
                                  {key.id}
                                </td>
                              )}

                              {/* Actions 3-dot dropdown */}
                              <td className="py-3 px-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44 p-1 rounded-xl shadow-lg">
                                    <DropdownMenuItem
                                      onClick={() => handleCopy(key.fullSecret, key.id)}
                                      className="text-xs flex items-center gap-2 cursor-pointer"
                                    >
                                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                      Copy Key Value
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleCopy(key.id, key.id)}
                                      className="text-xs flex items-center gap-2 cursor-pointer"
                                    >
                                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                                      Copy Key ID
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem
                                      onClick={() => handleRevokeKey(app.id, key.id)}
                                      className="text-xs text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Revoke Key
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Card Footer Action: + CREATE NEW API KEY */}
                <div className="p-3 bg-muted/10 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCreateKey(app.id)}
                    className="rounded-lg h-7 px-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-border/80 hover:bg-muted cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    CREATE NEW API KEY
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        /* Account Keys Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Organization Root Keys</h2>
          </div>

          <Card className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/70 text-[11px] font-mono font-medium text-muted-foreground/80 bg-muted/20">
                    <th className="py-2.5 px-4 font-mono font-semibold">Key Name</th>
                    <th className="py-2.5 px-4 font-mono font-semibold">API Key Value</th>
                    <th className="py-2.5 px-4 font-mono font-semibold">Created By</th>
                    <th className="py-2.5 px-4 font-mono font-semibold">Created At</th>
                    {showKeyIds && <th className="py-2.5 px-4 font-mono font-semibold">Key ID</th>}
                    <th className="py-2.5 px-3 text-right font-mono font-semibold w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {accountKeys.map((key) => {
                    const isRevealed = revealedKeys[key.id]
                    const isCopied = copiedKeyId === key.id

                    return (
                      <tr key={key.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                          {key.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {isRevealed ? key.fullSecret : key.maskedValue}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealKey(key.id)}
                              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                              {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(key.fullSecret, key.id)}
                              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{key.createdBy}</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono">{key.createdAt}</td>
                        {showKeyIds && (
                          <td className="py-3 px-4 font-mono text-[11px] text-foreground/90">{key.id}</td>
                        )}
                        <td className="py-3 px-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 p-1 rounded-xl shadow-lg">
                              <DropdownMenuItem
                                onClick={() => handleCopy(key.fullSecret, key.id)}
                                className="text-xs flex items-center gap-2 cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                Copy Key Value
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRevokeKey(null, key.id)}
                                className="text-xs text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Revoke Key
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-muted/10 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCreateKey('account')}
                className="rounded-lg h-7 px-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-border/80 hover:bg-muted cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                CREATE NEW ACCOUNT KEY
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create API Key Modal Dialog */}
      <Dialog open={isCreateKeyModalOpen} onOpenChange={setIsCreateKeyModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {createdSecret ? 'API Key Generated' : 'Create New API Key'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {createdSecret
                ? 'Make sure to copy your API key now as you will not be able to see it again.'
                : 'Enter a recognizable name for this key to identify its purpose.'}
            </DialogDescription>
          </DialogHeader>

          {createdSecret ? (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                  Store this key securely. For security reasons, this value cannot be retrieved again after closing this window.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">API Key Secret</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={createdSecret}
                    className="rounded-lg font-mono text-xs h-9 bg-muted/30 select-all"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(createdSecret)
                      setCopiedCreatedSecret(true)
                      setTimeout(() => setCopiedCreatedSecret(false), 2000)
                    }}
                    className="rounded-lg h-9 px-3 text-white font-medium shadow-xs"
                    style={{ background: 'var(--primary)' }}
                  >
                    {copiedCreatedSecret ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsCreateKeyModalOpen(false)}
                  className="rounded-lg text-xs w-full text-white font-semibold shadow-xs"
                  style={{ background: 'var(--primary)' }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreateKeySubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="key-name" className="text-xs font-semibold">
                  API Key Name
                </Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Production Worker Daemon"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="rounded-lg h-8 text-xs"
                  required
                />
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateKeyModalOpen(false)}
                  className="rounded-lg text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newKeyName.trim()}
                  className="rounded-lg text-xs text-white font-semibold shadow-xs"
                  style={{ background: 'var(--primary)' }}
                >
                  Generate Key
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create App Modal Dialog */}
      <Dialog open={isCreateAppModalOpen} onOpenChange={setIsCreateAppModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create New Application</DialogTitle>
            <DialogDescription className="text-xs">
              Group and isolate API keys by environment or product module.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAppSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="app-name" className="text-xs font-semibold">
                Application Name
              </Label>
              <Input
                id="app-name"
                placeholder="e.g. Staging Crawler"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="rounded-lg h-8 text-xs"
                required
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateAppModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newAppName.trim()}
                className="rounded-lg text-xs text-white font-semibold shadow-xs"
                style={{ background: 'var(--primary)' }}
              >
                Create App
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
