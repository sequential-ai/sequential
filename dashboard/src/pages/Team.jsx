import React, { useState, useEffect, useMemo } from 'react'
import { Skeleton } from 'boneyard-js/react'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useUser } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { api } from '@/api/client'
import {
  Users,
  UserPlus,
  Plus,
  Mail,
  Shield,
  Trash2,
  CheckCircle2,
  Search,
  MoreVertical,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles,
  UserCheck,
  Clock,
  ExternalLink,
  Filter,
} from 'lucide-react'

const roleStyles = {
  ADMIN:
    "bg-primary/10 text-primary border-primary/20",

  MEMBER:
    "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-white/[0.06] dark:text-neutral-300 dark:border-white/10",
}

const statusStyles = {
  ACTIVE:
    "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",

  PENDING:
    "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",

  SUSPENDED:
    "bg-red-50 text-red-700 border-red-200/70 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
}

const ROLE_DESCRIPTIONS = {
  ADMIN: 'Full access to manage workspace settings, billing, API keys, and team members.',
  MEMBER: 'Can run parallel research pipelines, view synthesis reports, and inspect telemetry.',
}

function TeamFallback() {
  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/70">
        <div className="space-y-1.5">
          <UiSkeleton className="h-7 w-32 rounded-lg" />
          <UiSkeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <UiSkeleton className="h-8 w-28 rounded-lg" />
          <UiSkeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <UiSkeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border/40">
          <UiSkeleton className="h-5 w-40 rounded" />
          <UiSkeleton className="h-8 w-36 rounded-lg" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
            <UiSkeleton className="h-4 w-48 rounded" />
            <UiSkeleton className="h-6 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Team() {
  const { org, activeOrgId, dbUser, refreshProfile, isSyncing } = useAuth()
  const { user } = useUser()

  // State
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // Action Modals State
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', message: string }

  const currentOrgId = org?.id || activeOrgId || 'active'

  // Fetch members from backend
  const fetchMembers = async (showLoader = false) => {
    if (showLoader) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await api.getMembers(currentOrgId)
      if (res.data?.success && res.data?.data) {
        const { allMembers, members: activeMembers = [], invites = [] } = res.data.data
        const combined = allMembers || [...activeMembers, ...invites]
        setMembers(combined)
      }
    } catch (err) {
      console.warn('Failed to load team members from API:', err)
      // If error, keep existing or provide fallback
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMembers(true)
  }, [currentOrgId])

  // Show transient feedback message
  const showFeedback = (type, message) => {
    setFeedback({ type, message })
    setTimeout(() => {
      setFeedback(null)
    }, 4000)
  }

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle Invite Submit
  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim() || isSubmittingInvite) return

    const normalizedEmail = inviteEmail.trim().toLowerCase()

    setInviteError('')

    // Client-side pre-check: already an active member?
    const existingMember = members.find(
      (m) => m.email?.toLowerCase() === normalizedEmail && !m.isInvite
    )
    if (existingMember) {
      setInviteError(`${normalizedEmail} is already a member of this workspace.`)
      return
    }

    // Client-side pre-check: already has a pending invite?
    const existingInvite = members.find(
      (m) => m.email?.toLowerCase() === normalizedEmail && m.isInvite
    )
    if (existingInvite) {
      setInviteError(`An invitation has already been sent to ${normalizedEmail}. They haven't accepted it yet.`)
      return
    }

    setIsSubmittingInvite(true)

    try {
      const res = await api.addMember(currentOrgId, {
        email: normalizedEmail,
        role: inviteRole,
      })

      if (res.data?.success) {
        showFeedback('success', res.data.message || 'Invitation sent successfully')
        setIsInviteOpen(false)
        setInviteEmail('')
        setInviteRole('MEMBER')
        await fetchMembers(false)
        refreshProfile?.()
      } else {
        setInviteError(res.data?.message || 'Failed to add member')
      }
    } catch (err) {
      console.error('Invite member error:', err)
      setInviteError(err.response?.data?.message || 'Failed to send invitation. Please try again.')
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  // Handle Role Change
  const handleRoleChange = async (memberId, newRole) => {
    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    )

    try {
      const res = await api.updateMemberRole(currentOrgId, memberId, newRole)
      if (res.data?.success) {
        showFeedback('success', `Role updated to ${newRole}`)
        refreshProfile?.()
      }
    } catch (err) {
      console.error('Role update error:', err)
      showFeedback('error', err.response?.data?.message || 'Failed to update role')
      fetchMembers(false)
    }
  }

  // Handle Remove Member or Revoke Invite
  const handleConfirmRemove = async () => {
    if (!memberToRemove || isRemoving) return
    setIsRemoving(true)

    try {
      if (memberToRemove.isInvite || memberToRemove.status === 'INVITED') {
        const res = await api.cancelInvite(currentOrgId, memberToRemove.id)
        if (res.data?.success) {
          showFeedback('success', 'Invitation canceled')
        }
      } else {
        const res = await api.removeMember(currentOrgId, memberToRemove.id)
        if (res.data?.success) {
          showFeedback('success', 'Member removed from workspace')
        }
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id))
      setMemberToRemove(null)
      refreshProfile?.()
    } catch (err) {
      console.error('Remove error:', err)
      showFeedback('error', err.response?.data?.message || 'Failed to remove member')
    } finally {
      setIsRemoving(false)
    }
  }

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search query filter
      const matchesSearch =
        searchQuery === '' ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchQuery.toLowerCase())

      // Role filter
      const matchesRole = roleFilter === 'ALL' || m.role === roleFilter

      // Status filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && m.status === 'ACTIVE') ||
        (statusFilter === 'INVITED' && (m.status === 'INVITED' || m.isInvite))

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [members, searchQuery, roleFilter, statusFilter])

  // Count active vs invited
  const activeCount = members.filter((m) => m.status === 'ACTIVE').length
  const invitedCount = members.filter((m) => m.status === 'INVITED' || m.isInvite).length

  return (
    <Skeleton
      name="team-page"
      loading={isSyncing || isLoading}
      fallback={<TeamFallback />}
      className="w-full min-w-0"
    >
      <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between text-xs font-medium border animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Members & Permissions</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
              {org?.name || 'Workspace'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage organization members, workspace access, and role-based access control (RBAC).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMembers(false)}
            disabled={isRefreshing || isLoading}
            className="rounded h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground border-border/80 cursor-pointer"
            title="Refresh members"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </Button>

          <Button
            onClick={() => {
              setInviteError('')
              setIsInviteOpen(true)
            }}
            size="sm"
            className="rounded h-8 px-3.5 text-xs font-semibold text-white shadow-xs cursor-pointer"
            style={{ background: 'var(--primary)' }}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      {members.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs rounded-lg bg-card border-border/80"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter Tabs */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-background text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active ({activeCount})
              </button>
              {invitedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('INVITED')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'INVITED'
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pending ({invitedCount})
                </button>
              )}
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 text-xs rounded-lg w-[120px] bg-card border-border/80">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Main Members Content */}
      {isLoading ? (
        /* Loading Skeleton */
        <Card className="rounded-xl border-border bg-card shadow-xs p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-7 w-7 text-primary animate-spin mb-3" />
          <p className="text-xs text-muted-foreground font-mono">Loading organization team members...</p>
        </Card>
      ) : members.length === 0 ? (
        /* Primary Empty State (0 Members in Organization) */
        <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <Users className="h-8 w-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">No Team Members Yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are currently the only person in this workspace. Invite colleagues to collaborate on parallel research pipelines, share API keys, and monitor multi-agent telemetry together.
              </p>
            </div>

            {/* Quick Benefits list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full pt-2 text-left">
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Granular RBAC
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Custom roles from Admin to Analyst</p>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Instant Access
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Secure one-click colleague onboarding</p>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  Shared Credits
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Unified ledger across worker tasks</p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  setInviteError('')
                  setIsInviteOpen(true)
                }}
                className="rounded h-9 px-5 text-xs font-bold text-white shadow-md cursor-pointer"
                style={{ background: 'var(--primary)' }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Colleague
              </Button>
            </div>
          </div>
        </Card>
      ) : filteredMembers.length === 0 ? (
        /* Filter / Search Empty State */
        <Card className="rounded-xl border border-border/80 bg-card p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">No matching members found</h4>
            <p className="text-xs text-muted-foreground">
              No team members match your current search "{searchQuery}" or filter selection.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setRoleFilter('ALL')
              setStatusFilter('ALL')
            }}
            className="rounded text-xs h-8 cursor-pointer"
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        /* Team Table Card */
        <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">
                Workspace Members ({filteredMembers.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Users authorized to trigger research pipelines, manage keys, and inspect telemetry
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 uppercase text-muted-foreground font-medium text-[10px]">
                    <th className="py-2.5 px-4 font-mono font-semibold">Email</th>
                    <th className="py-2.5 px-4 font-mono font-semibold">Role</th>
                    <th className="py-2.5 px-4 font-mono font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-mono font-semibold">Joined / Invited</th>
                    <th className="py-2.5 px-4 text-right font-mono font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMembers.map((m) => {
                    const isCurrentUser =
                      m.isCurrentUser ||
                      m.email === (user?.primaryEmailAddress?.emailAddress || dbUser?.email)
                    const isInvited = m.status === 'INVITED' || m.isInvite
                    const isOwner = m.role === 'OWNER'

                    return (
                      <tr
                        key={m.id}
                        className={`transition-colors group ${
                          isInvited ? 'bg-muted/10 hover:bg-muted/20' : 'hover:bg-muted/30'
                        }`}
                      >
                        {/* Email column */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-foreground font-medium">{m.email}</span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role column */}
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 cursor-pointer focus:outline-hidden"
                              >
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-mono px-2 py-0.5 hover:opacity-80 transition-opacity font-medium ${
                                    roleStyles[m.role] || roleStyles.MEMBER
                                  }`}
                                >
                                  {m.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
                                </Badge>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 p-1 rounded-xl shadow-lg">
                              <div className="px-2 py-1 text-[10px] font-mono text-muted-foreground uppercase font-bold">
                                Change Role
                              </div>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(m.id, 'ADMIN')}
                                className="text-xs cursor-pointer"
                              >
                                Admin (Full Settings & Members)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(m.id, 'MEMBER')}
                                className="text-xs cursor-pointer"
                              >
                                Member (Pipelines & Reports)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>

                        {/* Status column */}
                        <td className="py-3 px-4">
                          {isInvited ? (
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono font-medium px-2 py-0.5 ${statusStyles.PENDING}`}
                            >
                              PENDING
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono font-medium px-2 py-0.5 ${
                                statusStyles[m.status] || statusStyles.ACTIVE
                              }`}
                            >
                              {m.status || 'ACTIVE'}
                            </Badge>
                          )}
                        </td>

                        {/* Joined/Invited date */}
                        <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                          {m.joinedAt}
                        </td>

                        {/* Actions column */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 p-1 rounded-xl shadow-lg">
                                <DropdownMenuItem
                                  onClick={() => handleCopy(m.email, m.id)}
                                  className="text-xs flex items-center gap-2 cursor-pointer"
                                >
                                  {copiedId === m.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                                      Email Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                      Copy Email
                                    </>
                                  )}
                                </DropdownMenuItem>

                                {!isCurrentUser && (
                                  <>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem
                                      onClick={() => setMemberToRemove(m)}
                                      className="text-xs text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      {isInvited ? 'Cancel Invitation' : 'Remove Member'}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Definitions Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Card className="rounded-xl border-border bg-card shadow-xs p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">Admin</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            Full governance access to workspace settings, member invites, role changes, billing, and API credential management.
          </p>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-xs p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-bold text-foreground">Member</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            Can trigger parallel research pipelines, inspect results, configure personal tokens, and review citations.
          </p>
        </Card>
      </div>

      {/* Add / Invite Member Dialog Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Add Member to Workspace
            </DialogTitle>
            <DialogDescription className="text-xs">
              Invite a colleague to collaborate in <span className="font-semibold text-foreground">{org?.name || 'this workspace'}</span>.
            </DialogDescription>
          </DialogHeader>

          {inviteError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-semibold">
                Email Address
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value)
                  if (inviteError) setInviteError('')
                }}
                className="rounded-lg h-8 text-xs"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role" className="text-xs font-semibold">
                Role & Access Level
              </Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role" className="rounded-lg h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin (Full Workspace, Billing & Team Control)</SelectItem>
                  <SelectItem value="MEMBER">Member (Research Pipelines & Reports)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                {ROLE_DESCRIPTIONS[inviteRole] || ''}
              </p>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsInviteOpen(false)}
                className="rounded text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!inviteEmail.trim() || isSubmittingInvite}
                className="rounded text-xs text-white font-medium shadow-xs cursor-pointer"
                style={{ background: 'var(--primary)' }}
              >
                {isSubmittingInvite ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Sending Invite...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member / Revoke Invite Confirmation Dialog */}
      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {memberToRemove?.isInvite || memberToRemove?.status === 'INVITED'
                ? 'Cancel Invitation'
                : 'Remove Member from Workspace'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-foreground font-mono">
                {memberToRemove?.email}
              </span>{' '}
              from <span className="font-semibold text-foreground">{org?.name || 'this workspace'}</span>?
              {!memberToRemove?.isInvite &&
                ' They will immediately lose access to all research projects, keys, and telemetry.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMemberToRemove(null)}
              className="rounded text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isRemoving}
              onClick={handleConfirmRemove}
              className="rounded text-xs font-semibold shadow-xs cursor-pointer"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Removing...
                </>
              ) : memberToRemove?.isInvite || memberToRemove?.status === 'INVITED' ? (
                'Revoke Invite'
              ) : (
                'Remove Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Skeleton>
  )
}
