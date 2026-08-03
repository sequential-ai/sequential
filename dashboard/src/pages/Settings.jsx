import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { useUser } from '@clerk/clerk-react'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Copy,
  Check,
  AlertTriangle,
  Trash2,
  Loader2,
  Edit2,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

function SettingsFallback() {
  return (
    <div className="w-full space-y-6 p-1">
      <UiSkeleton className="h-8 w-40 rounded-lg" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50 bg-muted/10">
              <UiSkeleton className="h-4 w-36 rounded" />
            </div>
            <div className="p-5 space-y-3">
              <UiSkeleton className="h-4 w-64 rounded" />
              <UiSkeleton className="h-4 w-48 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { org, activeOrgId, isSyncing, userRole, isAdmin, updateOrganization, deleteOrganization, dbUser, credits } = useAuth()
  const { user } = useUser()

  // Form & Settings States
  const [orgName, setOrgName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInputValue, setNameInputValue] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  const [allowBroadVisibility, setAllowBroadVisibility] = useState(true)
  const [isSavingVisibility, setIsSavingVisibility] = useState(false)

  // Copy Org ID state
  const [isCopied, setIsCopied] = useState(false)

  // Terms Modal State
  const [isTermsOpen, setIsTermsOpen] = useState(false)

  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteStage, setDeleteStage] = useState('idle') // 'idle' | 'deleting' | 'success'
  const [deletedOrgSummary, setDeletedOrgSummary] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  // Toast / Feedback message
  const [feedback, setFeedback] = useState(null)

  // Sync state when org changes
  useEffect(() => {
    if (org) {
      setOrgName(org.name || 'Sequential')
      setNameInputValue(org.name || 'Sequential')
      
      const broadVis = org.metadata?.broadQueryVisibility ?? org.settings?.broadQueryVisibility ?? true
      setAllowBroadVisibility(Boolean(broadVis))
    }
  }, [org])

  const showFeedback = (type, message) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 3500)
  }

  // Format date helper: "8/3/2026, 12:24:46 PM"
  const formatDateString = (dateInput) => {
    const d = dateInput ? new Date(dateInput) : new Date()
    if (isNaN(d.getTime())) return '8/3/2026, 12:24:46 PM'
    return d.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const acceptedAtFormatted = org?.createdAt ? formatDateString(org.createdAt) : '8/3/2026, 12:24:46 PM'
  
  const lastModifiedByEmail =
    org?.metadata?.lastModifiedBy ||
    dbUser?.email ||
    user?.primaryEmailAddress?.emailAddress ||
    'admin@sequential.ai'

  const lastModifiedAtFormatted = org?.metadata?.lastModifiedAt
    ? formatDateString(org.metadata.lastModifiedAt)
    : (org?.updatedAt ? formatDateString(org.updatedAt) : '8/3/2026, 5:26:20 PM')

  // Copy Org ID
  const handleCopyOrgId = () => {
    const idToCopy = org?.id || activeOrgId || ''
    if (!idToCopy) return
    navigator.clipboard.writeText(idToCopy)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Save Organization Name
  const handleSaveName = async () => {
    if (!isAdmin) {
      showFeedback('error', 'Only workspace Admins can update organization details.')
      return
    }
    if (!nameInputValue.trim()) {
      showFeedback('error', 'Organization name cannot be empty.')
      return
    }

    setIsSavingName(true)
    try {
      const nowIso = new Date().toISOString()
      const res = await updateOrganization('active', {
        name: nameInputValue.trim(),
        metadata: {
          ...(org?.metadata || {}),
          lastModifiedBy: dbUser?.email || user?.primaryEmailAddress?.emailAddress || 'admin@sequential.ai',
          lastModifiedAt: nowIso,
        }
      })

      if (res.success) {
        setOrgName(nameInputValue.trim())
        setIsEditingName(false)
        showFeedback('success', 'Organization name updated')
      } else {
        showFeedback('error', res.message || 'Failed to update name')
      }
    } catch (err) {
      showFeedback('error', err.message || 'An error occurred')
    } finally {
      setIsSavingName(false)
    }
  }

  // Toggle Broad Query Visibility
  const handleToggleVisibility = async (checked) => {
    if (!isAdmin) {
      showFeedback('error', 'Only workspace Admins can update platform settings.')
      return
    }

    const nextVal = Boolean(checked)
    setAllowBroadVisibility(nextVal)
    setIsSavingVisibility(true)

    try {
      const nowIso = new Date().toISOString()
      const res = await updateOrganization('active', {
        metadata: {
          ...(org?.metadata || {}),
          broadQueryVisibility: nextVal,
          lastModifiedBy: dbUser?.email || user?.primaryEmailAddress?.emailAddress || 'admin@sequential.ai',
          lastModifiedAt: nowIso,
        }
      })

      if (res.success) {
        showFeedback('success', nextVal ? 'Broad query visibility enabled' : 'Broad query visibility restricted to Admins')
      } else {
        // Revert on error
        setAllowBroadVisibility(!nextVal)
        showFeedback('error', res.message || 'Failed to update setting')
      }
    } catch (err) {
      setAllowBroadVisibility(!nextVal)
      showFeedback('error', err.message || 'Failed to update setting')
    } finally {
      setIsSavingVisibility(false)
    }
  }

  // Delete Organization with Clear Multi-Stage UX
  const handleDeleteOrganization = async () => {
    const currentName = org?.name
    if (deleteConfirmText.trim() !== currentName) {
      setDeleteError('Please type the exact organization name to confirm.')
      return
    }

    setIsDeleting(true)
    setDeleteStage('deleting')
    setDeleteError('')

    try {
      const res = await deleteOrganization('active')
      if (res.success) {
        const nextMembership = res.remainingMemberships?.[0]
        const nextName = nextMembership?.organization?.name || 'your remaining workspace'
        const nextRole = nextMembership?.role === 'ADMIN' ? 'Admin' : 'Member'

        setDeletedOrgSummary({
          deletedName: currentName,
          nextName,
          hasRemaining: res.hasRemainingWorkspaces,
        })
        setDeleteStage('success')

        // Flash message for the destination page
        sessionStorage.setItem(
          'seq_flash_notification',
          JSON.stringify({
            type: 'success',
            title: 'Organization Deleted',
            message: res.hasRemainingWorkspaces
              ? `Organization "${currentName}" was permanently deleted. Switched to workspace "${nextName}" (${nextRole}).`
              : `Organization "${currentName}" was permanently deleted. Create or join a new workspace to continue.`,
          })
        )

        // Give user 1.2s to visually see the deletion confirmation before smooth redirect
        setTimeout(() => {
          setIsDeleteDialogOpen(false)
          setDeleteStage('idle')
          setIsDeleting(false)

          if (res.hasRemainingWorkspaces) {
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/onboard', { replace: true })
          }
        }, 1200)
      } else {
        setDeleteStage('idle')
        setIsDeleting(false)
        setDeleteError(res.message || 'Failed to delete workspace')
      }
    } catch (err) {
      setDeleteStage('idle')
      setIsDeleting(false)
      setDeleteError(err.message || 'Failed to delete workspace')
    }
  }

  return (
    <Skeleton
      name="settings-page"
      loading={isSyncing}
      fallback={<SettingsFallback />}
      className="w-full min-w-0"
    >
      <div className="w-full space-y-6 pb-12">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              Organization
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isAdmin
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          </div>

          {feedback && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border animate-in fade-in slide-in-from-top-1 duration-200 flex items-center gap-1.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {feedback.message}
            </div>
          )}
        </div>

        {/* Member Role Informational Banner */}
        {!isAdmin && (
          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-2.5 text-xs animate-in fade-in duration-200">
            <ShieldCheck className="h-4 w-4 shrink-0 text-blue-500" />
            <span>
              You are viewing <strong>{orgName}</strong> with <strong>Member</strong> permissions. Organization settings, broad query visibility, and workspace deletion require <strong>Admin</strong> access.
            </span>
          </div>
        )}

        {/* 1. Organization Details Card */}
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-border/60 bg-muted/15">
            <h2 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
              Organization Details
            </h2>
          </div>

          <div className="px-5 py-4 space-y-4 text-xs sm:text-sm">
            {/* Your Role Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
              <span className="text-muted-foreground sm:w-48 font-normal">
                Your Role
              </span>
              <div className="flex-1 flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    isAdmin
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isAdmin
                    ? 'Full workspace management & billing access'
                    : 'Standard research & task execution access'}
                </span>
              </div>
            </div>

            {/* Name Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
              <span className="text-muted-foreground sm:w-48 font-normal">
                Name
              </span>
              <div className="flex-1 flex items-center justify-between sm:justify-start gap-3">
                {isEditingName ? (
                  <div className="flex items-center gap-2 w-full max-w-sm">
                    <Input
                      value={nameInputValue}
                      onChange={(e) => setNameInputValue(e.target.value)}
                      placeholder="Organization Name"
                      className="h-8 text-xs rounded-md bg-muted/30"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveName}
                      disabled={isSavingName || !nameInputValue.trim()}
                      className="h-8 px-3 text-xs rounded-md text-white font-medium cursor-pointer"
                      style={{ background: 'var(--primary)' }}
                    >
                      {isSavingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNameInputValue(orgName)
                        setIsEditingName(false)
                      }}
                      className="h-8 px-2 text-xs rounded-md cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className="font-medium text-foreground">
                      {orgName}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="flex gap-1 ml-4 items-center text-xs font-medium bg-muted/60 hover:bg-muted transition-colors py-1 px-2 text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
                        title="Edit name"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Org ID Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
              <span className="text-muted-foreground sm:w-48 font-normal">
                Org ID
              </span>
              <div className="flex-1 flex items-center gap-2">
                <span className="font-mono text-xs text-foreground select-all">
                  {org?.id || activeOrgId || '299c38aa-4b11-4769-a98c-e2e431e7e9c4'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrgId}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded cursor-pointer"
                  title="Copy Org ID"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Terms Card */}
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
          <div className="px-5 py-3 border-b border-border/60 bg-muted/15 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
              Terms
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTermsOpen(true)}
              className="h-6.5 text-[10px] font-bold tracking-wider uppercase px-2.5 rounded-md border-border/80 text-foreground hover:bg-muted cursor-pointer"
            >
              VIEW TERMS
            </Button>
          </div>

          <div className="px-5 py-4 space-y-3.5 text-xs sm:text-sm">
            {/* Legal Terms Accepted Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
              <span className="text-muted-foreground sm:w-48 font-normal">
                Legal Terms Accepted
              </span>
              <span className="flex-1 font-medium text-foreground">
                Yes
              </span>
            </div>

            {/* Accepted At Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
              <span className="text-muted-foreground sm:w-48 font-normal">
                Accepted At
              </span>
              <span className="flex-1 font-medium text-foreground">
                {acceptedAtFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Platform Settings Card */}
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-border/60 bg-muted/15">
            <h2 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
              Platform Settings
            </h2>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Toggle Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  Allow broad query visibility
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  Lets members, not just admins, view query and usage activity on platform from all users in the organization.
                </p>
              </div>

              <div className="pt-0.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowBroadVisibility}
                  disabled={!isAdmin || isSavingVisibility}
                  onClick={() => handleToggleVisibility(!allowBroadVisibility)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                    allowBroadVisibility
                      ? 'bg-foreground'
                      : 'bg-muted/70 dark:bg-neutral-800'
                  }`}
                  title={isAdmin ? "Toggle broad query visibility" : "Only Admins can change this setting"}
                >
                  <span
                    className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-xs ring-0 transition-transform duration-200 ${
                      allowBroadVisibility ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  >
                    {allowBroadVisibility && (
                      <Check className="h-3 w-3 text-foreground stroke-[3]" />
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="border-t border-border/50 my-2" />

            {/* Audit Modified Subtext */}
            <p className="text-[11px] text-muted-foreground/80 font-normal">
              Last modified by {lastModifiedByEmail} on {lastModifiedAtFormatted}
            </p>
          </div>
        </div>

        {/* 4. Danger Zone Card */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.02] dark:bg-red-500/[0.04] overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-red-500/15 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <h2 className="text-xs sm:text-sm font-semibold text-red-500 tracking-tight">
              Danger Zone
            </h2>
          </div>

          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-foreground">
                Delete Organization
              </h3>
              <p className="text-[11px] text-muted-foreground max-w-xl">
                Permanently delete <strong className="text-foreground">{org?.name}</strong>, along with all API keys, member associations, and pipeline traces.
              </p>
            </div>

            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteConfirmText('')
                  setDeleteError('')
                  setDeleteStage('idle')
                  setIsDeleteDialogOpen(true)
                }}
                className="h-8 px-3 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/40 shrink-0 cursor-pointer rounded-lg"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete Organization
              </Button>
            ) : (
              <span className="text-[11px] text-muted-foreground border border-border px-2.5 py-1 rounded-md">
                Admin required
              </span>
            )}
          </div>
        </div>

        {/* Terms Dialog */}
        <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-border bg-card p-6 shadow-xl">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <DialogTitle className="text-base font-bold text-foreground">
                  Sequential Platform Terms
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Organization Master Services & Data Governance Agreement
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs text-muted-foreground leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
                <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  1. Tenant Isolation & Data Privacy
                </h4>
                <p className="text-[11px]">
                  All research pipelines, synthesize traces, token telemetry, and workspace assets are strictly isolated to your organization tenant. Data is encrypted in-transit (TLS 1.3) and at-rest (AES-256).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
                <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  2. Role-Based Governance
                </h4>
                <p className="text-[11px]">
                  Workspace Admins maintain complete control over member access, credit allocation, API keys, and deletion. Members may trigger research pipelines and review citations within their authorized workspace.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
                <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  3. Service Availability & Rate Limits
                </h4>
                <p className="text-[11px]">
                  Parallel research executions are governed by active tier concurrency limits and automated health checks to ensure sub-second response times and zero pipeline starvation.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTermsOpen(false)}
                className="rounded-lg h-8 text-xs font-medium cursor-pointer"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !isDeleting && setIsDeleteDialogOpen(open)}>
          <DialogContent className="sm:max-w-[440px] rounded-2xl border-border bg-card p-6 shadow-xl">
            {deleteStage === 'deleting' ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center animate-pulse">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    Deleting Organization...
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Permanently deleting <strong className="text-foreground">{org?.name}</strong> and purging associated data...
                  </p>
                </div>
              </div>
            ) : deleteStage === 'success' ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    Organization Deleted
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {deletedOrgSummary?.hasRemaining
                      ? `Switching you to "${deletedOrgSummary?.nextName}"...`
                      : 'Redirecting to workspace onboarding...'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <DialogHeader className="space-y-2">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-1">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Delete Organization
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                    This action is permanent and cannot be reversed. All research logs, projects, and API keys under <strong className="text-foreground">{org?.name}</strong> will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-3">
                  {/* Credit balance warning */}
                  {credits > 0 && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-500 leading-relaxed">
                        This workspace has{' '}
                        <span className="font-bold">{credits.toLocaleString()} credit{credits !== 1 ? 's' : ''}</span>{' '}
                        remaining. Deleting it will{' '}
                        <span className="font-bold">permanently forfeit</span> these credits —{' '}
                        they cannot be recovered or transferred.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">
                      To confirm, type <span className="font-semibold text-red-500 select-all">{org?.name}</span> below:
                    </Label>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={org?.name}
                      className="rounded-lg h-9 text-xs font-mono bg-muted/20"
                      autoFocus
                    />
                  </div>

                  {deleteError && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {deleteError}
                    </p>
                  )}
                </div>

                <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                    className="rounded-lg h-8 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDeleteOrganization}
                    disabled={deleteConfirmText.trim() !== org?.name || isDeleting}
                    className="rounded-lg h-8 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Permanently Delete
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Skeleton>
  )
}
