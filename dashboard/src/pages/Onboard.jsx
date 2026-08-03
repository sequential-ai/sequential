import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useUser } from '@clerk/clerk-react'
import {
  Plus,
  Check,
  ChevronDown,
  ArrowLeft,
  X,
  Loader2,
  Building2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Sequential Brand Sphere Logo with horizontal slices and warm primary core
function SequentialSphereIcon({ className = 'w-7 h-7' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="14" fill="#121215" stroke="#27272a" strokeWidth="1.2" />
      {/* Horizontal cut stripes with Sequential orange core emphasis */}
      <path d="M6 10H26" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 13H28" stroke="#d4d4d8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2.5 16H29.5" stroke="#FB631B" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M4 19H28" stroke="#d4d4d8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 22H26" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// Sequential Brand Logo with Glyphs
function SequentialWordmark({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 cursor-pointer select-none group transition-opacity hover:opacity-90"
    >

      <span
        className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display"
        style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)' }}
      >
        Sequential
      </span>
    </div>
  )
}

// Architectural striped illusion artwork for the survey modal header with Sequential primary glow
function ArchitecturalStripesBanner() {
  return (
    <div className="w-full h-44 relative bg-gradient-to-b from-[#110f0e] via-[#121216] to-[#0c0c0f] overflow-hidden flex items-center justify-center border-b border-zinc-800/80">
      {/* Subtle warm ember backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,99,27,0.18),transparent_70%)]" />

      <svg
        className="w-full h-full object-cover opacity-90"
        viewBox="0 0 600 200"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="slitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#e4e4e7" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#a1a1aa" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#27272a" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="orangeSlitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FB631B" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#fb923c" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="pedimentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="50%" stopColor="#52525b" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>
        </defs>

        {/* Top Architectural Entablature */}
        <path d="M120 30 L480 30 L460 50 L140 50 Z" fill="url(#pedimentGrad)" opacity="0.85" />
        <rect x="135" y="52" width="330" height="12" rx="2" fill="#3f3f46" opacity="0.9" />

        {/* Vertical Slit Pillars & Optical Frequency Grid */}
        {Array.from({ length: 95 }).map((_, i) => {
          const x = 70 + i * 4.9
          const isCenter = x > 250 && x < 350
          const isDoorway = x > 280 && x < 320
          const y1 = isDoorway ? 95 : 68
          const y2 = 185
          const isOrangeAccent = (i >= 42 && i <= 52 && i % 2 === 0) || i === 47

          return (
            <line
              key={i}
              x1={x}
              y1={y1}
              x2={x}
              y2={y2}
              stroke={isOrangeAccent ? 'url(#orangeSlitGrad)' : 'url(#slitGrad)'}
              strokeWidth={isOrangeAccent ? 2.6 : i % 2 === 0 ? 2.2 : 1.2}
              strokeLinecap="round"
              opacity={isCenter ? (isDoorway ? 0.3 : 0.75) : 0.85}
            />
          )
        })}

        {/* Arch beam over doorway */}
        <rect x="250" y="88" width="100" height="8" rx="2" fill="#52525b" opacity="0.85" />

        {/* Colonnade Base Plinth */}
        <rect x="100" y="186" width="400" height="8" rx="1" fill="#3f3f46" opacity="0.95" />
      </svg>

      {/* Subtle vignette overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0f] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0f] via-transparent to-[#0c0c0f]" />
    </div>
  )
}

const SURVEY_OPTIONS = [
  { id: 'podcast', label: 'Podcast' },
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'ai_chat', label: 'ChatGPT / Claude' },
  { id: 'billboard', label: 'Billboard / Outdoor Ads' },
  { id: 'google', label: 'Google' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'event', label: 'At an event' },
  { id: 'word_of_mouth', label: 'Word of Mouth' },
  { id: 'other', label: 'Other' },
]

export default function Onboard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { dbUser, memberships, switchOrganization, createOrganization, org } = useAuth()

  // Steps:
  // 0 = Select or Create Org Hub
  // 1 = Create Org Name (Step 1 of 2)
  // 2 = Invite Members (Step 2 of 2)
  // 3 = Welcome Modal (Survey)
  const initialStepParam = searchParams.get('step')
  const [step, setStep] = useState(() => {
    if (initialStepParam === 'create' || initialStepParam === '1') return 1
    return 0
  })

  // Form states
  const [orgName, setOrgName] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [selectedRole, setSelectedRole] = useState('Admin')
  const [invites, setInvites] = useState([])
  const [selectedSurvey, setSelectedSurvey] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // If user opens directly with step param change
  useEffect(() => {
    if (initialStepParam === 'create' || initialStepParam === '1') {
      setStep(1)
    }
  }, [initialStepParam])

  // Handle selecting an existing organization
  const handleSelectOrg = (selectedOrgId) => {
    switchOrganization(selectedOrgId)
    navigate('/dashboard')
  }

  // Handle Step 1 -> Step 2
  const handleStep1Submit = (e) => {
    e.preventDefault()
    if (!orgName.trim()) {
      setErrorMessage('Please enter an organization name')
      return
    }
    setErrorMessage('')
    setStep(2)
  }

  // Add invite email chip
  const handleAddEmail = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = emailInput.trim().replace(/,/g, '')
      if (trimmed && trimmed.includes('@')) {
        if (!invites.some((inv) => inv.email === trimmed)) {
          setInvites([...invites, { email: trimmed, role: selectedRole }])
        }
        setEmailInput('')
      }
    }
  }

  const removeInvite = (emailToRemove) => {
    setInvites(invites.filter((inv) => inv.email !== emailToRemove))
  }

  // Handle Step 2 -> Step 3 (Welcome Survey Modal)
  const handleStep2Submit = () => {
    let currentInvites = [...invites]
    const trimmed = emailInput.trim().replace(/,/g, '')
    if (trimmed && trimmed.includes('@') && !currentInvites.some((inv) => inv.email === trimmed)) {
      currentInvites.push({ email: trimmed, role: selectedRole })
      setInvites(currentInvites)
      setEmailInput('')
    }
    setStep(3)
  }

  // Toggle survey pill selection
  const toggleSurveyOption = (id) => {
    if (selectedSurvey.includes(id)) {
      setSelectedSurvey(selectedSurvey.filter((item) => item !== id))
    } else {
      setSelectedSurvey([...selectedSurvey, id])
    }
  }

  // Final Step 3 -> Create Organization & Finish Onboarding
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

  // List of existing user organizations (from dbUser, active org, or default Gmail)
  const existingOrgs =
    memberships && memberships.length > 0
      ? memberships.map((m) => ({
        id: m.organization?.id || m.organizationId,
        name: m.organization?.name || org?.name || 'Gmail',
        role: m.role === 'OWNER' || m.role === 'ADMIN' ? 'Admin' : m.role,
      }))
      : [
        {
          id: org?.id || 'default-org',
          name: org?.name || 'Gmail',
          role: 'Admin',
        },
      ]

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between relative selection:bg-[#FB631B]/30 selection:text-white font-sans overflow-x-hidden">
      {/* Top Ambient Glow with Sequential Primary Hue */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[340px] bg-gradient-to-b from-[#FB631B]/10 via-[#FB631B]/3 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* Top Left Sphere Logo */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/dashboard" className="opacity-90 hover:opacity-100 transition-transform hover:scale-105">
          <SequentialSphereIcon className="w-8 h-8" />
        </Link>
      </div>

      {/* Top Center Brand Wordmark */}
      <header className="pt-10 pb-4 flex items-center justify-center z-10">
        <SequentialWordmark onClick={() => setStep(0)} />
      </header>

      {/* Main Dynamic View Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 w-full max-w-xl mx-auto">
        {/* ========================================================================= */}
        {/* SCREEN 1: Create or Join an Organization (Hub) */}
        {/* ========================================================================= */}
        {step === 0 && (
          <div className="w-full max-w-lg flex flex-col items-center animate-in fade-in duration-200">
            <h1 className="text-3xl md:text-[34px] font-bold text-white tracking-tight text-center font-display" style={{ fontFamily: 'var(--font-display)' }}>
              Create or Join an Organization
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 text-center mt-2.5 max-w-md">
              Creating or joining an organization will give you access to Sequential's APIs
            </p>

            {/* YOUR ORGANIZATIONS Section Divider */}
            <div className="w-full mt-12 mb-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800/70" />
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-2">
                YOUR ORGANIZATIONS
              </span>
              <div className="flex-1 h-px bg-zinc-800/70" />
            </div>

            {/* Existing Orgs List */}
            <div className="w-full space-y-3">
              {existingOrgs.map((item) => (
                <div
                  key={item.id}
                  className="w-full bg-[#121215] border border-zinc-800/80 hover:border-zinc-700/90 rounded-2xl p-4 flex items-center justify-between transition-all shadow-lg hover:shadow-zinc-950/60"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-inner">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-base font-semibold text-white truncate">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Active Workspace
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0f2438] text-sky-400 border border-sky-800/40">
                      {item.role}
                    </span>
                    <button
                      onClick={() => handleSelectOrg(item.id)}
                      className="px-4 py-2 rounded bg-white hover:bg-[#FB631B] text-black hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* CREATE NEW Section Divider */}
            <div className="w-full mt-10 mb-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800/70" />
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-2">
                CREATE NEW
              </span>
              <div className="flex-1 h-px bg-zinc-800/70" />
            </div>

            {/* Create an organization Card */}
            <div
              onClick={() => setStep(1)}
              className="w-full bg-[#121215] border border-zinc-800/80 hover:border-[#FB631B]/50 hover:bg-[#15151a] rounded-2xl p-4 flex items-center gap-4 cursor-pointer group transition-all shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800/90 group-hover:bg-[#FB631B] border border-zinc-700/60 group-hover:border-[#FB631B] flex items-center justify-center text-white transition-all shrink-0 shadow-inner">
                <Plus className="w-6 h-6 text-zinc-300 group-hover:text-white transition-transform group-hover:scale-110" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-white group-hover:text-zinc-100 transition-colors">
                  Create an organization
                </span>
                <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  Set up a collaborative team workspace
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: Create your Organization - Step 1 of 2 */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="w-full max-w-md flex flex-col items-center animate-in fade-in duration-200">
            <h1 className="text-3xl md:text-[34px] font-bold text-white tracking-tight text-center font-display" style={{ fontFamily: 'var(--font-display)' }}>
              Create your Organization
            </h1>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FB631B]" />
              <span className="text-xs text-zinc-400 font-medium">Step 1 of 2</span>
            </div>

            <form onSubmit={handleStep1Submit} className="w-full mt-9 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block text-left">
                  Organization name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp or Sequential Labs"
                  autoFocus
                  required
                  className="w-full h-11 bg-[#121215] border border-zinc-800 focus:border-[#FB631B] focus:ring-2 focus:ring-[#FB631B]/20 rounded-xl text-white px-3.5 text-sm outline-none placeholder:text-zinc-600 transition shadow-inner"
                />
                {errorMessage && (
                  <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-[#FB631B] hover:bg-[#e05210] text-white font-bold rounded text-sm transition shadow-lg shadow-[#FB631B]/20 mt-3 flex items-center justify-center cursor-pointer"
              >
                Continue
              </button>

              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-xs text-zinc-400 hover:text-white font-medium transition text-center w-full py-1.5 block cursor-pointer"
              >
                Back
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: Who else should join? - Step 2 of 2 */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="w-full max-w-md flex flex-col items-center animate-in fade-in duration-200">
            <h1 className="text-3xl md:text-[34px] font-bold text-white tracking-tight text-center font-display" style={{ fontFamily: 'var(--font-display)' }}>
              Who else should join?
            </h1>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FB631B]" />
              <span className="text-xs text-zinc-400 font-medium">Step 2 of 2</span>
            </div>

            <div className="w-full mt-9 space-y-4">
              <div className="flex items-center w-full">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleAddEmail}
                  placeholder="Enter email addresses"
                  className="flex-1 h-11 bg-[#121215] border border-zinc-800 focus:border-[#FB631B] focus:ring-2 focus:ring-[#FB631B]/20 rounded-l-xl text-white px-3.5 text-sm outline-none placeholder:text-zinc-600 transition shadow-inner"
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-11 px-3.5 bg-[#18181d] border border-zinc-800 border-l-0 rounded-r text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 focus:outline-none transition shrink-0 cursor-pointer">
                      <span>{selectedRole}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#18181d] border border-zinc-800 text-white rounded-xl shadow-xl w-32"
                  >
                    <DropdownMenuItem
                      onClick={() => setSelectedRole('Admin')}
                      className="text-xs cursor-pointer hover:bg-zinc-800 rounded-lg"
                    >
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedRole('Member')}
                      className="text-xs cursor-pointer hover:bg-zinc-800 rounded-lg"
                    >
                      Member
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedRole('Viewer')}
                      className="text-xs cursor-pointer hover:bg-zinc-800 rounded-lg"
                    >
                      Viewer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Added emails list */}
              {invites.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {invites.map((inv) => (
                    <span
                      key={inv.email}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/90 border border-zinc-700 text-xs text-zinc-200"
                    >
                      <span className="font-mono">{inv.email}</span>
                      <span className="text-[10px] text-[#FB631B] font-semibold uppercase">
                        ({inv.role})
                      </span>
                      <X
                        className="w-3.5 h-3.5 text-zinc-400 hover:text-white cursor-pointer"
                        onClick={() => removeInvite(inv.email)}
                      />
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-3 space-y-3">
                {invites.length > 0 || emailInput.trim() ? (
                  <button
                    type="button"
                    onClick={handleStep2Submit}
                    className="w-full h-11 bg-[#FB631B] hover:bg-[#e05210] text-white font-bold rounded text-sm transition shadow-lg shadow-[#FB631B]/20 flex items-center justify-center cursor-pointer"
                  >
                    Invite &amp; Continue
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleStep2Submit}
                  className="text-xs text-zinc-400 hover:text-white font-medium transition text-center w-full py-1.5 block cursor-pointer"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: Welcome to Sequential! Survey Modal */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="w-full max-w-lg bg-[#0e0e12] border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden relative backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Top Architectural Illusional Striped Banner with Sequential Primary Ember */}
            <ArchitecturalStripesBanner />

            {/* Modal Body */}
            <div className="p-6 md:p-8 flex flex-col items-center">
              <h2
                className="text-2xl md:text-3xl font-bold text-white tracking-tight text-center font-display"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Welcome to Sequential!
              </h2>

              <p className="text-xs md:text-[13px] text-zinc-400 text-center mt-2 px-4">
                <span className="font-semibold text-zinc-200">
                  Where did you hear about Sequential?
                </span>{' '}
                (select as many as apply)
              </p>

              {/* 2-Column Selectable Options Grid */}
              <div className="grid grid-cols-2 gap-2.5 w-full mt-6">
                {SURVEY_OPTIONS.map((item) => {
                  const isChecked = selectedSurvey.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSurveyOption(item.id)}
                      className={`px-3.5 py-3 rounded-xl border flex items-center gap-3 cursor-pointer select-none transition-all ${isChecked
                          ? 'bg-[#FB631B]/15 border-[#FB631B]/70 text-white shadow-sm shadow-[#FB631B]/10'
                          : 'bg-[#141418]/90 hover:bg-[#1c1c22] border-zinc-800/90 text-zinc-300'
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isChecked
                            ? 'bg-[#FB631B] border-[#FB631B] text-white'
                            : 'border-zinc-600 bg-transparent'
                          }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-medium truncate">{item.label}</span>
                    </div>
                  )
                })}
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-400 font-medium mt-4 text-center">
                  {errorMessage}
                </p>
              )}

              {/* Primary Start Button with Sequential Accent */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteOnboarding}
                className="w-full h-11 bg-[#FB631B] hover:bg-[#e05210] text-white font-bold rounded text-sm transition shadow-lg shadow-[#FB631B]/25 mt-7 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting up workspace...</span>
                  </>
                ) : (
                  <span>Start using Sequential</span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Global Bottom Footer */}
      <footer className="w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 font-mono uppercase tracking-wider gap-2 z-10">
        <div>POWERED BY SEQUENTIAL WEB SYSTEMS © 2026</div>
        <div className="flex items-center gap-4">
          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-zinc-300 transition-colors"
          >
            PRIVACY POLICY &amp; TERMS OF SERVICE
          </a>
        </div>
      </footer>
    </div>
  )
}
