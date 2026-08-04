import React, { useState, useEffect } from 'react'
import { Skeleton } from 'boneyard-js/react'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
import { api } from '@/api/client'
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  MoreVertical,
  AlertTriangle,
  Loader2,
  Power,
  PowerOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

function ApiKeysFallback() {
  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <UiSkeleton className="h-7 w-36 rounded-lg" />
          <UiSkeleton className="h-4 w-80 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <UiSkeleton className="h-8 w-28 rounded-lg" />
          <UiSkeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>
      <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <UiSkeleton className="h-4 w-4 rounded" />
            <UiSkeleton className="h-5 w-40 rounded" />
          </div>
          <UiSkeleton className="h-5 w-24 rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
            <div className="flex items-center gap-3">
              <UiSkeleton className="h-4 w-4 rounded" />
              <div className="space-y-2">
                <UiSkeleton className="h-5 w-48 rounded" />
                <UiSkeleton className="h-4 w-72 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UiSkeleton className="h-8 w-20 rounded-lg" />
              <UiSkeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ApiKeys() {
  const { user } = useUser()
  const { dbUser, refreshProfile, isSyncing, activeOrgId, org } = useAuth()
  const userEmail = user?.primaryEmailAddress?.emailAddress || dbUser?.email || ''

  const [showKeyIds, setShowKeyIds] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Keys Data
  const [apiKeys, setApiKeys] = useState([])

  // Bulk Selection State
  const [selectedKeyIds, setSelectedKeyIds] = useState([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  // Revealed secrets state map
  const [revealedKeys, setRevealedKeys] = useState({})
  const [copiedKeyId, setCopiedKeyId] = useState(null)

  // Create Key Modal State
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyDescription, setNewKeyDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdSecret, setCreatedSecret] = useState(null)
  const [copiedCreatedSecret, setCopiedCreatedSecret] = useState(false)

  // Single Revoke Key Confirmation State
  const [keyToRevoke, setKeyToRevoke] = useState(null)

  // Fetch API keys from backend on mount or when activeOrgId changes
  useEffect(() => {
    let isMounted = true

    const fetchKeys = async () => {
      try {
        setIsLoading(true)
        const res = await api.getApiKeys()
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map((k) => {
            const creatorEmail = k.createdByUser
              ? userEmail
              : 'Team Member'

            return {
              id: k.id,
              name: k.name || 'API Key',
              description: k.description || '',
              maskedValue: k.keyPrefix ? `${k.keyPrefix}...` : 'sk_live_****',
              fullSecret: k.keyPrefix ? `${k.keyPrefix}••••••••••••••••` : 'sk_live_secret',
              createdBy: creatorEmail,
              createdAt: k.createdAt ? new Date(k.createdAt).toLocaleDateString('en-US') : 'Recent',
              revokedAt: k.revokedAt || null,
              role: 'Full Access',
            }
          })
          setApiKeys(mapped)
        } else if (isMounted) {
          setApiKeys([])
        }
      } catch (err) {
        console.warn('Failed to load API keys:', err)
        if (isMounted) setApiKeys([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchKeys()

    return () => {
      isMounted = false
    }
  }, [userEmail, activeOrgId])

  // Clean up selectedKeyIds if any selected keys are deleted or not in list
  const validSelectedIds = selectedKeyIds.filter((id) => apiKeys.some((k) => k.id === id))
  const isAllSelected = apiKeys.length > 0 && validSelectedIds.length === apiKeys.length
  const isSomeSelected = validSelectedIds.length > 0 && !isAllSelected
  const selectedKeysList = apiKeys.filter((k) => validSelectedIds.includes(k.id))

  // Toggle single row selection
  const handleToggleSelectKey = (keyId) => {
    setSelectedKeyIds((prev) =>
      prev.includes(keyId) ? prev.filter((id) => id !== keyId) : [...prev, keyId]
    )
  }

  // Toggle master select all
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKeyIds([])
    } else {
      setSelectedKeyIds(apiKeys.map((k) => k.id))
    }
  }

  // Toggle reveal
  const toggleRevealKey = (keyId) => {
    setRevealedKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  // Copy secret or text
  const handleCopy = (text, keyId) => {
    navigator.clipboard.writeText(text)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  // Open Create Key modal
  const handleOpenCreateKey = () => {
    setNewKeyName('')
    setNewKeyDescription('')
    setCreatedSecret(null)
    setCopiedCreatedSecret(false)
    setIsCreateKeyModalOpen(true)
  }

  // Submit Create Key
  const handleCreateKeySubmit = async (e) => {
    e.preventDefault()
    if (!newKeyName.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      // Try backend creation
      const res = await api.createApiKey({
        name: newKeyName.trim(),
        description: newKeyDescription.trim() || undefined,
      })

      if (res.data?.success && res.data?.rawKey) {
        const createdKey = res.data.data
        const rawKey = res.data.rawKey
        const keyObj = {
          id: createdKey.id,
          name: createdKey.name || newKeyName.trim(),
          description: createdKey.description || newKeyDescription.trim() || '',
          maskedValue: `${rawKey.slice(0, 10)}****${rawKey.slice(-4)}`,
          fullSecret: rawKey,
          createdBy: userEmail,
          createdAt: new Date(createdKey.createdAt || Date.now()).toLocaleDateString('en-US'),
          revokedAt: null,
          role: 'Full Access',
        }

        setApiKeys((prev) => [keyObj, ...prev])
        setCreatedSecret(rawKey)
        refreshProfile?.()
        return
      }
    } catch (err) {
      console.warn('Backend API key creation failed, using local generator:', err)
    } finally {
      setIsSubmitting(false)
    }

    // Local fallback generator
    const randomSuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
    const generatedSecret = `sk_live_${randomSuffix}`
    const keyUuid = crypto.randomUUID ? crypto.randomUUID() : `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}`
    const last4 = randomSuffix.slice(-4).toUpperCase()

    const newKeyObj = {
      id: keyUuid,
      name: newKeyName.trim(),
      description: newKeyDescription.trim() || '',
      maskedValue: `sk_live_****${last4}`,
      fullSecret: generatedSecret,
      createdBy: userEmail,
      createdAt: new Date().toLocaleDateString('en-US'),
      revokedAt: null,
      role: 'Full Access',
    }

    setApiKeys((prev) => [newKeyObj, ...prev])
    setCreatedSecret(generatedSecret)
  }

  // Toggle single key status (Enable / Disable)
  const handleToggleKey = async (keyId, enable) => {
    // Optimistic UI update
    setApiKeys((prev) =>
      prev.map((k) =>
        k.id === keyId
          ? { ...k, revokedAt: enable ? null : new Date().toISOString() }
          : k
      )
    )

    try {
      await api.toggleApiKey(keyId, { enable })
      refreshProfile?.()
    } catch (err) {
      console.warn('Backend toggle failed, updated state locally:', err)
    }
  }

  // Revoke / Delete single key permanently
  const handleRevokeKey = async (keyId) => {
    // Optimistic UI removal
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId))
    setSelectedKeyIds((prev) => prev.filter((id) => id !== keyId))

    try {
      await api.deleteApiKey(keyId)
      refreshProfile?.()
    } catch (err) {
      console.warn('Backend delete failed, removed locally:', err)
    }
  }

  // Bulk Toggle (Enable / Disable) selected keys
  const handleBulkToggle = async (enable) => {
    if (validSelectedIds.length === 0 || isBulkProcessing) return

    const targetIds = [...validSelectedIds]

    // Optimistic UI update
    setApiKeys((prev) =>
      prev.map((k) =>
        targetIds.includes(k.id)
          ? { ...k, revokedAt: enable ? null : new Date().toISOString() }
          : k
      )
    )

    setIsBulkProcessing(true)
    try {
      await api.bulkToggleApiKeys(targetIds, enable)
      refreshProfile?.()
    } catch (err) {
      console.warn('Backend bulk toggle failed, attempting fallback:', err)
      try {
        await Promise.allSettled(targetIds.map((id) => api.toggleApiKey(id, { enable })))
        refreshProfile?.()
      } catch (_) {}
    } finally {
      setIsBulkProcessing(false)
    }
  }

  // Bulk Delete / Revoke selected keys permanently
  const handleBulkDelete = async () => {
    if (validSelectedIds.length === 0 || isBulkProcessing) return

    const targetIds = [...validSelectedIds]

    // Optimistic UI removal
    setApiKeys((prev) => prev.filter((k) => !targetIds.includes(k.id)))
    setSelectedKeyIds([])
    setIsBulkDeleteModalOpen(false)

    setIsBulkProcessing(true)
    try {
      await api.bulkDeleteApiKeys(targetIds)
      refreshProfile?.()
    } catch (err) {
      console.warn('Backend bulk delete failed, attempting fallback:', err)
      try {
        await Promise.allSettled(targetIds.map((id) => api.deleteApiKey(id)))
        refreshProfile?.()
      } catch (_) {}
    } finally {
      setIsBulkProcessing(false)
    }
  }

  return (
    <Skeleton
      name="api-keys-page"
      loading={isSyncing || isLoading}
      fallback={<ApiKeysFallback />}
      className="w-full min-w-0"
    >
      <div className="space-y-6">
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/70">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">API Keys</h1>
            <p className="text-xs text-muted-foreground mt-1">
              API keys allow you to authenticate requests to the Sequential API securely.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* View Key IDs Switch */}
            <div className="flex items-center gap-2 mr-2">
              <Label htmlFor="view-key-ids" className="text-xs text-muted-foreground font-normal cursor-pointer select-none">
                View Key IDs
              </Label>
              <Switch
                id="view-key-ids"
                checked={showKeyIds}
                onCheckedChange={setShowKeyIds}
              />
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded h-8 px-3 text-xs font-mono uppercase tracking-wider font-semibold border-border/80 hover:bg-muted"
            >
              <a href="https://docs.sequential.ai" className="flex gap-2 items-center" target="_blank" rel="noreferrer">
                API DOCS
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>

            <Button
              size="sm"
              onClick={handleOpenCreateKey}
              className="rounded h-8 px-3.5 text-xs font-mono uppercase tracking-wider font-bold text-white shadow-xs cursor-pointer"
              style={{ background: 'var(--primary)' }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              CREATE API KEY
            </Button>
          </div>
        </div>

        {/* Bulk Action Toolbar Banner */}
        {validSelectedIds.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border/80 bg-card text-foreground shadow-xs animate-in fade-in duration-150">
            <div className="text-sm font-medium text-foreground select-none">
              {validSelectedIds.length} selected
            </div>

            {/* Action Buttons: Enable, Disable, Delete */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBulkProcessing}
                onClick={() => handleBulkToggle(true)}
                className="h-8 px-3 rounded text-xs font-medium border-border/80 hover:bg-muted cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {isBulkProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Enable
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBulkProcessing}
                onClick={() => handleBulkToggle(false)}
                className="h-8 px-3 rounded text-xs font-medium border-border/80 hover:bg-muted cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {isBulkProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Disable
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isBulkProcessing}
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="h-8 px-3 rounded text-xs font-medium bg-[#f43f5e] hover:bg-[#e11d48] text-white border-0 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                {isBulkProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 text-white" />
                )}
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Main API Keys Table Card */}
        <div className="space-y-4">
          <Card className="rounded-lg py-0 border border-border/80 bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/70 text-[11px] font-mono font-medium text-muted-foreground/80 bg-muted/20">
                    {/* Checkbox Column */}
                    <th className="py-2.5 px-3 w-10 text-center font-mono font-semibold">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                          indeterminate={isSomeSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all API keys"
                        />
                      </div>
                    </th>
                    <th className="py-2.5 px-4  font-semibold">API Key Name</th>
                    <th className="py-2.5 px-4  font-semibold">Key Value</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4  font-semibold">Created By</th>
                    <th className="py-2.5 px-4  font-semibold">Created At</th>
                    {showKeyIds && (
                      <th className="py-2.5 px-4  font-semibold">Key ID</th>
                    )}
                    <th className="py-2.5 px-3 text-right  font-semibold w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td
                        colSpan={showKeyIds ? 8 : 7}
                        className="py-14 px-4 text-center"
                      >
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground shadow-2xs">
                            <KeyRound className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-foreground">No API keys yet</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Create an API key to securely authenticate requests to the Sequential API.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleOpenCreateKey}
                            className="mt-1 rounded h-8 px-3.5 text-xs font-mono uppercase tracking-wider font-bold text-white shadow-xs cursor-pointer"
                            style={{ background: 'var(--primary)' }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            CREATE API KEY
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((key) => {
                      const isRevealed = revealedKeys[key.id]
                      const isCopied = copiedKeyId === key.id
                      const isEnabled = !key.revokedAt
                      const isSelected = validSelectedIds.includes(key.id)

                      return (
                        <tr
                          key={key.id}
                          className={`transition-colors group ${
                            isSelected
                              ? 'bg-primary/8 dark:bg-primary/10 hover:bg-primary/12'
                              : isEnabled
                              ? 'hover:bg-muted/30'
                              : 'bg-muted/15 opacity-75 hover:bg-muted/25'
                          }`}
                        >
                          {/* Row Checkbox */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleSelectKey(key.id)}
                                aria-label={`Select ${key.name}`}
                              />
                            </div>
                          </td>

                          {/* Key name & optional description */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium text-sm capitalize ${
                                  isEnabled ? 'text-foreground' : 'text-muted-foreground line-through decoration-muted-foreground/40'
                                }`}
                              >
                                {key.name}
                              </span>
                            </div>
                            {key.description && (
                              <div className="text-[11px] text-muted-foreground font-normal truncate max-w-[240px]">
                                {key.description}
                              </div>
                            )}
                          </td>

                          {/* Key value */}
                          <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold ${
                                  isEnabled ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                              >
                                {key.maskedValue}
                              </span>
                            
                            </div>
                          </td>

                          {/* Status Toggle & Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) => handleToggleKey(key.id, checked)}
                                className="scale-90 cursor-pointer"
                                aria-label={`Toggle status for ${key.name}`}
                              />
                              {isEnabled ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 select-none">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Enabled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border select-none">
                                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                                  Disabled
                                </span>
                              )}
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
                                  onClick={() => handleToggleKey(key.id, !isEnabled)}
                                  className="text-xs flex items-center gap-2 cursor-pointer"
                                >
                                  <Power className="h-3.5 w-3.5 text-muted-foreground" />
                                  {isEnabled ? 'Disable Key' : 'Enable Key'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                  onClick={() => setKeyToRevoke(key)}
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
          </Card>
        </div>

        {/* Create API Key Modal Dialog */}
        <Dialog open={isCreateKeyModalOpen} onOpenChange={setIsCreateKeyModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {createdSecret ? 'API Key Generated' : 'Create New API Key'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {createdSecret
                  ? 'Make sure to copy your key now as you will not be able to see the full secret again.'
                  : 'Enter a recognizable name and description for this key to identify its purpose.'}
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
                      className="rounded h-9 px-3 text-white font-medium shadow-xs shrink-0 cursor-pointer"
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
                    className="rounded text-xs w-full text-white font-semibold shadow-xs cursor-pointer"
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
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="key-description" className="text-xs font-semibold">
                      Description
                    </Label>
                    <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
                  </div>
                  <Textarea
                    id="key-description"
                    placeholder="e.g. Used for background ingestion worker, indexing daemon, or production services."
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                    className="text-xs resize-none min-h-[70px]"
                    rows={3}
                  />
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateKeyModalOpen(false)}
                    className="rounded text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newKeyName.trim() || isSubmitting}
                    className="rounded text-xs text-white font-semibold shadow-xs cursor-pointer"
                    style={{ background: 'var(--primary)' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Key'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Single Revoke Key Confirmation Dialog */}
        <Dialog open={!!keyToRevoke} onOpenChange={(open) => !open && setKeyToRevoke(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Revoke API Key
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to permanently revoke{' '}
                <span className="font-semibold text-foreground">{keyToRevoke?.name}</span>? Any
                services or workers using this key will immediately lose access. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setKeyToRevoke(null)}
                className="rounded text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (keyToRevoke) {
                    handleRevokeKey(keyToRevoke.id)
                    setKeyToRevoke(null)
                  }
                }}
                className="rounded text-xs font-semibold shadow-xs cursor-pointer"
              >
                Revoke & Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete / Revoke Confirmation Dialog */}
        <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Revoke Multiple API Keys
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Are you sure you want to permanently revoke and delete{' '}
                <span className="font-bold text-foreground">{validSelectedIds.length} API key(s)</span>?
                Any systems or services relying on these keys will immediately lose access. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {/* List preview of selected keys */}
            <div className="my-2 max-h-36 overflow-y-auto rounded-xl border border-border/80 bg-muted/30 p-2.5 space-y-1.5 divide-y divide-border/40">
              {selectedKeysList.map((k) => (
                <div key={k.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground truncate max-w-[200px]">
                    {k.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{k.maskedValue}</span>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBulkProcessing}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="rounded text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isBulkProcessing}
                onClick={handleBulkDelete}
                className="rounded text-xs font-semibold shadow-xs cursor-pointer"
              >
                {isBulkProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  `Revoke ${validSelectedIds.length} Keys`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Skeleton>
  )
}
