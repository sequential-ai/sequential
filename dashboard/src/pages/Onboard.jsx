import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useUser, useClerk } from '@clerk/clerk-react'
import {
  Plus,
  Check,
  ChevronDown,
  X,
  Loader2,
  Building2,
  Users,
  Sun,
  Moon,
  Mail,
  Shield,
  Sparkles,
  ArrowRight,
  LogOut,
  UserCheck,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Deterministic multi-color gradients for organization avatars (Linear/Vercel style)
const ORG_GRADIENTS = [
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-rose-500 via-pink-500 to-purple-600",
  "from-fuchsia-500 via-pink-500 to-rose-500",
  "from-indigo-500 via-blue-600 to-cyan-500",
  "from-teal-400 via-emerald-500 to-green-600",
  "from-orange-500 via-rose-500 to-red-600",
  "from-violet-600 via-indigo-600 to-blue-700",
]

const getOrgGradient = (name = "") => {
  if (!name) return ORG_GRADIENTS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % ORG_GRADIENTS.length
  return ORG_GRADIENTS[index]
}

// Roles according to the Sequential Organization Schema
const SCHEMA_ROLES = [
  { value: 'ADMIN', label: 'Admin', desc: 'Full workspace, member, and API governance' },
  { value: 'MEMBER', label: 'Member', desc: 'Trigger research pipelines & inspect telemetry' },
]

const ROLE_LABELS = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
}

// Sequential Brand Logo with Glyphs
function SequentialWordmark({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 cursor-pointer select-none group transition-opacity hover:opacity-90"
    >
      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
        S
      </div>
      <span
        className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground font-display"
        style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)' }}
      >
        Sequential
      </span>
    </div>
  )
}

// Architectural striped banner artwork with Sequential primary glow
function ArchitecturalStripesBanner() {
  return (
    <div className="w-full h-32 md:h-36 relative bg-gradient-to-b from-orange-500/10 via-muted/40 to-card dark:from-[#110f0e] dark:via-[#121216] dark:to-[#0c0c0f] overflow-hidden flex items-center justify-center border-b border-border">
      {/* Subtle warm ember backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,99,27,0.14),transparent_70%)]" />
      <svg className="w-full h-full object-cover opacity-90" viewBox="0 0 600 160" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="orangeSlitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FB631B" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#fb923c" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="pedimentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#71717a" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#a1a1aa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#71717a" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path d="M120 20 L480 20 L460 36 L140 36 Z" fill="url(#pedimentGrad)" className="dark:fill-zinc-700 fill-zinc-400" opacity="0.8" />
        <rect x="135" y="38" width="330" height="8" rx="2" className="dark:fill-zinc-700 fill-zinc-300" opacity="0.9" />
        {Array.from({ length: 95 }).map((_, i) => {
          const x = 70 + i * 4.9
          const isCenter = x > 250 && x < 350
          const isDoorway = x > 280 && x < 320
          const y1 = isDoorway ? 75 : 52
          const y2 = 148
          const isOrangeAccent = (i >= 42 && i <= 52 && i % 2 === 0) || i === 47
          return (
            <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={isOrangeAccent ? 'url(#orangeSlitGrad)' : 'currentColor'} className={isOrangeAccent ? '' : 'text-zinc-400 dark:text-zinc-500'} strokeWidth={isOrangeAccent ? 2.4 : i % 2 === 0 ? 1.8 : 1} strokeLinecap="round" opacity={isCenter ? (isDoorway ? 0.25 : 0.65) : 0.75} />
          )
        })}
        <rect x="250" y="68" width="100" height="6" rx="1.5" className="dark:fill-zinc-600 fill-zinc-400" opacity="0.85" />
        <rect x="100" y="148" width="400" height="6" rx="1" className="dark:fill-zinc-700 fill-zinc-300" opacity="0.9" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-card dark:from-[#0c0c0f] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-card dark:from-[#0c0c0f] via-transparent to-card dark:to-[#0c0c0f]" />
    </div>
  )
}

const SURVEY_OPTIONS = [
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'github', label: 'GitHub' },
  { id: 'ai_chat', label: 'ChatGPT / Claude' },
  { id: 'colleague', label: 'Friend / Colleague' },
  { id: 'google', label: 'Google Search' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'event', label: 'Conference / Event' },
  { id: 'other', label: 'Other' },
]

export default function Onboard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { signOut } = useClerk()
  const {
    dbUser,
    memberships,
    pendingInvites,
    switchOrganization,
    createOrganization,
    acceptInvite,
    declineInvite,
    completeOnboarding,
    org
  } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()

  const hasPendingInvites = Array.isArray(pendingInvites) && pendingInvites.length > 0
  const hasExistingOrgs = Array.isArray(memberships) && memberships.length > 0

  const initialStepParam = searchParams.get('step')
  const [step, setStep] = useState(() => {
    if (initialStepParam === 'create' || initialStepParam === '1') return 1
    return 0
  })

  const [orgName, setOrgName] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [selectedRole, setSelectedRole] = useState('MEMBER')
  const [invites, setInvites] = useState([])
  const [inviteInputError, setInviteInputError] = useState('')
  const [selectedSurvey, setSelectedSurvey] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [acceptingInviteId, setAcceptingInviteId] = useState(null)
  const [decliningInviteId, setDecliningInviteId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (initialStepParam === 'create' || initialStepParam === '1') {
      setStep(1)
    }
  }, [initialStepParam])

  const slugPreview = orgName.trim()
    ? orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : 'workspace-slug'

  const handleSelectOrg = (selectedOrgId) => {
    switchOrganization(selectedOrgId)
    completeOnboarding()
    navigate('/dashboard')
  }

  const handleAcceptInvite = async (inviteId) => {
    setAcceptingInviteId(inviteId)
    setErrorMessage('')
    try {
      const res = await acceptInvite(inviteId)
      if (res.success) {
        navigate('/dashboard')
      } else {
        setErrorMessage(res.message || 'Failed to accept invitation')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to accept invitation')
    } finally {
      setAcceptingInviteId(null)
    }
  }

  const handleDeclineInvite = async (inviteId) => {
    setDecliningInviteId(inviteId)
    try {
      await declineInvite(inviteId)
    } catch (err) {
      console.warn('Decline error:', err)
    } finally {
      setDecliningInviteId(null)
    }
  }

  const handleStep1Submit = (e) => {
    e.preventDefault()
    if (!orgName.trim()) {
      setErrorMessage('Please enter an organization name')
      return
    }
    setErrorMessage('')
    setStep(2)
  }

  const handleAddMember = () => {
    const trimmed = emailInput.trim().replace(/,/g, '')
    if (!trimmed) {
      setInviteInputError('Please enter an email address')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setInviteInputError('Please enter a valid email address')
      return
    }
    if (invites.some((inv) => inv.email.toLowerCase() === trimmed.toLowerCase())) {
      setInviteInputError('This email is already in the invite list')
      return
    }

    setInvites([...invites, { email: trimmed.toLowerCase(), role: selectedRole }])
    setEmailInput('')
    setInviteInputError('')
  }

  const removeInvite = (emailToRemove) => {
    setInvites(invites.filter((inv) => inv.email !== emailToRemove))
  }

  const handleStep2Submit = () => {
    let currentInvites = [...invites]
    const trimmed = emailInput.trim().replace(/,/g, '')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (trimmed && emailRegex.test(trimmed) && !currentInvites.some((inv) => inv.email.toLowerCase() === trimmed.toLowerCase())) {
      currentInvites.push({ email: trimmed.toLowerCase(), role: selectedRole })
      setInvites(currentInvites)
      setEmailInput('')
    }
    setStep(3)
  }

  const toggleSurveyOption = (id) => {
    if (selectedSurvey.includes(id)) {
      setSelectedSurvey(selectedSurvey.filter((item) => item !== id))
    } else {
      setSelectedSurvey([...selectedSurvey, id])
    }
  }

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const payload = {
        name: orgName.trim() || 'My Organization',
        invites: invites,
        surveyAnswers: selectedSurvey,
      }
      const res = await createOrganization(payload)
      if (res.success) {
        completeOnboarding()
        navigate('/dashboard')
      } else {
        setErrorMessage(res.message || 'Failed to create organization. Please try again.')
      }
    } catch (err) {
      console.error('Onboarding finalization failed:', err)
      setErrorMessage(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const existingOrgs =
    memberships && memberships.length > 0
      ? memberships.map((m) => ({
        id: m.organization?.id || m.organizationId,
        name: m.organization?.name || org?.name || 'Workspace',
        role: m.role === 'OWNER' || m.role === 'ADMIN' ? 'Admin' : m.role,
      }))
      : []

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative selection:bg-primary/25 selection:text-foreground font-sans overflow-x-hidden transition-colors">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[240px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl pointer-events-none -z-0" />
      <header className="w-full max-w-5xl mx-auto px-5 pt-5 pb-3 flex items-center justify-between z-20">
        <SequentialWordmark onClick={() => setStep(0)} />
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-foreground">{user.primaryEmailAddress?.emailAddress}</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 z-10 w-full max-w-lg mx-auto">
        {step === 0 && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight text-center font-display" style={{ fontFamily: 'var(--font-display)' }}>
              {hasPendingInvites ? 'Pending Invitations' : 'Create or Join an Organization'}
            </h1>
            <p className="text-xs text-muted-foreground text-center mt-1.5 max-w-sm">
              Collaborate on parallel deep research, manage API keys, and share team telemetry
            </p>
            {pendingInvites && pendingInvites.length > 0 && (
              <div className="w-full mt-6 space-y-3 animate-in fade-in duration-200">
                <div className="w-full flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
                    INVITED WORKSPACES ({pendingInvites.length})
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-2.5">
                  {pendingInvites.map((inv) => {
                    const invOrgName = inv.organization?.name || 'Shared Workspace'
                    const inviterName = inv.inviter?.firstName
                      ? `${inv.inviter.firstName} ${inv.inviter.lastName || ''}`.trim()
                      : (inv.invitedBy || 'Team Admin')
                    const roleName = ROLE_LABELS[inv.role] || inv.role?.toLowerCase() || 'Member'

                    return (
                      <div
                        key={inv.id || inv.inviteId}
                        className="w-full bg-card border border-border/80 hover:border-border rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Deterministic Multi-Color Gradient Avatar */}
                          <div
                            className={cn(
                              "w-11 h-11 rounded-xl bg-gradient-to-br text-white font-bold flex items-center justify-center text-base shrink-0 shadow-xs border border-white/10",
                              getOrgGradient(invOrgName)
                            )}
                          >
                            {invOrgName.charAt(0).toUpperCase()}
                          </div>

                          {/* Workspace Details */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {invOrgName}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <span className="capitalize">{roleName}</span>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                              <span className="truncate">
                                Invited by <span className="text-foreground/80 font-medium">{inviterName}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Secondary Outline Decline + Brand Primary Accept & Join */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={decliningInviteId === inv.id || acceptingInviteId === inv.id}
                            onClick={() => handleDeclineInvite(inv.id)}
                            className="flex-1 sm:flex-initial h-8 px-3.5 rounded border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition cursor-pointer disabled:opacity-50 shadow-2xs"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            disabled={acceptingInviteId === inv.id || decliningInviteId === inv.id}
                            onClick={() => handleAcceptInvite(inv.id)}
                            className="flex-1 sm:flex-initial h-8 px-4 rounded bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {acceptingInviteId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : null}
                            <span>Accept</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {existingOrgs.length > 0 && (
              <>
                <div className="w-full mt-6 mb-3 flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">YOUR ORGANIZATIONS</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="w-full space-y-2.5">
                  {existingOrgs.map((item) => (
                    <div key={item.id} className="w-full bg-card border border-border hover:border-border/80 rounded-xl p-3 sm:p-3.5 flex items-center justify-between transition-all shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs border border-white/10",
                            getOrgGradient(item.name)
                          )}
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
                          <span className="text-[11px] text-muted-foreground font-medium capitalize">{item.role?.toLowerCase() || 'Member'} · Active</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button onClick={() => handleSelectOrg(item.id)} className="px-3.5 py-1.5 rounded bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer">Select</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {existingOrgs.length === 0 && (!pendingInvites || pendingInvites.length === 0) && (
              <div className="w-full bg-card/60 border border-border/80 rounded-xl p-4 text-center my-3 shadow-2xs">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-foreground">No organizations joined yet</h3>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  Create your own team workspace below, or ask your administrator to invite <span className="font-medium text-foreground">{user?.primaryEmailAddress?.emailAddress || 'your email'}</span>.
                </p>
              </div>
            )}

            <div className="w-full mt-6 mb-3 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">CREATE NEW</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div onClick={() => setStep(1)} className="w-full bg-card border border-border hover:border-primary/50 hover:bg-muted/30 rounded-xl p-3.5 sm:p-4 flex items-center gap-3.5 cursor-pointer group transition-all shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-muted group-hover:bg-primary group-hover:text-primary-foreground border border-border group-hover:border-primary flex items-center justify-center text-foreground transition-all shrink-0 shadow-2xs">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-transform group-hover:scale-110" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Create an organization</span>
                <span className="text-[11px] text-muted-foreground transition-colors">Set up a collaborative team workspace</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="w-full max-w-sm flex flex-col items-center animate-in fade-in duration-200">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight text-center font-display" style={{ fontFamily: 'var(--font-display)' }}>Create your Organization</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground font-medium">Step 1 of 2</span>
            </div>
            <form onSubmit={handleStep1Submit} className="w-full mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block text-left">Organization name</label>
                <input type="text" value={orgName} onChange={(e) => { setOrgName(e.target.value); setErrorMessage('') }} placeholder="e.g. Acme Corp or Sequential Labs" autoFocus required className="w-full h-9 bg-card border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 rounded text-foreground px-3 text-xs outline-none placeholder:text-muted-foreground transition shadow-2xs" />
                <p className="text-[10px] text-muted-foreground font-mono">Slug: <span className="text-foreground">{slugPreview}</span></p>
                {errorMessage && <p className="text-xs text-destructive font-medium">{errorMessage}</p>}
              </div>
              <button type="submit" className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded text-xs transition shadow-xs mt-2 flex items-center justify-center cursor-pointer">Continue</button>
              <button type="button" onClick={() => setStep(0)} className="text-xs text-muted-foreground hover:text-foreground font-medium transition text-center w-full py-1 block cursor-pointer">← Back to Organizations</button>
            </form>
          </div>
        )}
        {step === 2 && (
          <div className="w-full max-w-md flex flex-col items-center animate-in fade-in duration-200">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight text-center font-display" style={{ fontFamily: 'var(--font-display)' }}>Who else should join?</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground font-medium">Step 2 of 2</span>
            </div>
            <div className="w-full mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block text-left">Invite team members</label>
                <div className="flex items-center gap-1.5 w-full">
                  <div className="flex items-center flex-1 min-w-0">
                    <input type="email" value={emailInput} onChange={(e) => { setEmailInput(e.target.value); setInviteInputError('') }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember() } }} placeholder="colleague@company.com" className="flex-1 min-w-0 h-9 bg-card border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-l text-foreground px-3 text-xs outline-none placeholder:text-muted-foreground transition shadow-2xs" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="h-9 px-2.5 bg-muted/60 hover:bg-muted border border-input border-l-0 rounded-r text-xs font-medium text-foreground flex items-center gap-1 focus:outline-none transition shrink-0 cursor-pointer">
                          <span>{ROLE_LABELS[selectedRole] || selectedRole}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border border-border text-popover-foreground rounded-lg shadow-md w-52 p-1">
                        {SCHEMA_ROLES.map((r) => (
                          <DropdownMenuItem key={r.value} onClick={() => setSelectedRole(r.value)} className="text-xs cursor-pointer hover:bg-muted rounded px-2 py-1.5 flex flex-col items-start gap-0.5">
                            <span className="font-semibold text-foreground">{r.label}</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">{r.desc}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <button type="button" onClick={handleAddMember} className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded text-xs transition shadow-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </button>
                </div>
                {inviteInputError && <p className="text-xs text-destructive font-medium mt-1">{inviteInputError}</p>}
              </div>
              {invites.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Invited Members ({invites.length})</span>
                    {invites.length > 1 && <button type="button" onClick={() => setInvites([])} className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer transition-colors">Clear all</button>}
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-0.5">
                    {invites.map((inv) => (
                      <div key={inv.email} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-[11px] truncate">{inv.email}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase tracking-wider shrink-0">{ROLE_LABELS[inv.role] || inv.role}</span>
                        </div>
                        <button type="button" onClick={() => removeInvite(inv.email)} className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer" title="Remove invite"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2 space-y-2">
                <button type="button" onClick={handleStep2Submit} className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded text-xs transition shadow-xs flex items-center justify-center cursor-pointer">{invites.length > 0 ? `Continue with ${invites.length} ${invites.length === 1 ? 'invite' : 'invites'}` : 'Continue'}</button>
                <div className="flex items-center justify-between pt-1">
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground font-medium transition py-1 cursor-pointer">Back</button>
                  <button type="button" onClick={handleStep2Submit} className="text-xs text-muted-foreground hover:text-foreground font-medium transition py-1 cursor-pointer">Skip for now</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden relative backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <ArchitecturalStripesBanner />
            <div className="p-5 md:p-6 flex flex-col items-center">
              <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight text-center font-display" style={{ fontFamily: 'var(--font-display)' }}>Welcome to Sequential!</h2>
              <p className="text-xs text-muted-foreground text-center mt-1.5 px-2">
                <span className="font-semibold text-foreground">Where did you hear about Sequential?</span> (select as many as apply)
              </p>
              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                {SURVEY_OPTIONS.map((item) => {
                  const isChecked = selectedSurvey.includes(item.id)
                  return (
                    <div key={item.id} onClick={() => toggleSurveyOption(item.id)} className={`px-3 py-2 rounded-lg border flex items-center gap-2.5 cursor-pointer select-none transition-all ${isChecked ? 'bg-primary/10 border-primary/60 text-foreground shadow-2xs' : 'bg-muted/40 hover:bg-muted/80 border-border text-muted-foreground hover:text-foreground'}`}>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 bg-card'}`}>{isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}</div>
                      <span className="text-xs font-medium truncate">{item.label}</span>
                    </div>
                  )
                })}
              </div>
              {errorMessage && <p className="text-xs text-destructive font-medium mt-3 text-center">{errorMessage}</p>}
              <button type="submit" disabled={isSubmitting} onClick={handleCompleteOnboarding} className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded text-xs transition shadow-xs mt-5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Setting up workspace...</span>
                  </>
                ) : (
                  <span>Start using Sequential</span>
                )}
              </button>
              <button type="button" disabled={isSubmitting} onClick={() => setStep(2)} className="text-xs text-muted-foreground hover:text-foreground font-medium transition text-center w-full py-1 mt-2 block cursor-pointer">Back to team invites</button>
            </div>
          </div>
        )}
      </main>
      <footer className="w-full px-5 py-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-wider gap-2 z-10">
        <div>POWERED BY SEQUENTIAL WEB SYSTEMS © 2026</div>
        <div className="flex items-center gap-4">
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-foreground transition-colors">PRIVACY POLICY &amp; TERMS OF SERVICE</a>
        </div>
      </footer>
    </div>
  )
}
