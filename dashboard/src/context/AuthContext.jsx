import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { api } from '@/api/client'

const AuthContext = createContext({
  dbUser: null,
  org: null,
  activeOrgId: null,
  memberships: [],
  pendingInvites: [],
  hasCompletedOnboarding: false,
  credits: 0,
  sub: null,
  apiKeys: [],
  syncStatus: 'idle',
  isSyncing: true,
  isSwitchingOrg: false,
  refreshProfile: async () => {},
  switchOrganization: async (orgId) => {},
  createOrganization: async (payload) => {},
  acceptInvite: async (inviteId) => {},
  declineInvite: async (inviteId) => {},
  completeOnboarding: () => {},
})

export function AuthProvider({ children }) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [dbUser, setDbUser] = useState(null)
  const [activeOrgId, setActiveOrgId] = useState(() => localStorage.getItem('seq_active_org_id'))
  const [syncStatus, setSyncStatus] = useState('Checking database...')
  const [isSyncing, setIsSyncing] = useState(true)
  const [isSwitchingOrg, setIsSwitchingOrg] = useState(false)

  const syncWithDatabase = useCallback(async () => {
    // If Clerk hasn't finished loading yet, stay in the loading state.
    // Do NOT set isSyncing=false here — that would cause a spurious /onboard redirect
    // on every page reload before Clerk hydrates.
    if (!isLoaded) {
      return
    }

    // If Clerk is loaded but the user is not signed in, stop loading
    if (!isSignedIn || !user) {
      setIsSyncing(false)
      return
    }

    setIsSyncing(true)
    setSyncStatus('Synchronizing workspace...')

    try {
      // 1. Try login
      try {
        const loginRes = await api.login(user.id)
        if (loginRes.data?.success) {
          if (loginRes.data.token) {
            localStorage.setItem('seq-token', loginRes.data.token)
          }
          setDbUser(loginRes.data.data)
          setSyncStatus('Workspace synchronized.')
          setIsSyncing(false)
          return
        }
      } catch (loginErr) {
        if (loginErr.response?.status !== 404) {
          throw loginErr
        }
      }

      // 2. If 404, register new user & workspace
      setSyncStatus('Provisioning workspace...')
      const registerRes = await api.register({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      })

      if (registerRes.data?.success) {
        if (registerRes.data.token) {
          localStorage.setItem('seq-token', registerRes.data.token)
        }
        setDbUser(registerRes.data.data)
        setSyncStatus('Workspace provisioned successfully.')
      }
    } catch (error) {
      console.error('Database sync failed:', error)
      setSyncStatus('Operating in local offline mode.')
    } finally {
      setIsSyncing(false)
    }
  }, [isLoaded, isSignedIn, user])

  useEffect(() => {
    syncWithDatabase()
  }, [syncWithDatabase])

  const refreshProfile = async () => {
    try {
      const res = await api.getProfile()
      if (res.data?.success) {
        setDbUser(res.data.data)
        return res.data.data
      }
    } catch (err) {
      console.warn('Profile refresh fallback:', err)
      await syncWithDatabase()
    }
  }

  const switchOrganization = async (orgId) => {
    if (!orgId || orgId === activeOrgId) return
    try {
      setIsSwitchingOrg(true)
      setActiveOrgId(orgId)
      localStorage.setItem('seq_active_org_id', orgId)
      // Small graceful pause so user perceives switching state clearly, then refresh
      await new Promise((resolve) => setTimeout(resolve, 350))
      await refreshProfile()
    } catch (err) {
      console.warn('Organization switch error:', err)
    } finally {
      setIsSwitchingOrg(false)
    }
  }

  const completeOnboarding = () => {
    if (user?.id) {
      localStorage.setItem(`seq_onboarded_${user.id}`, 'true')
    }
  }

  const createOrganization = async (payload) => {
    try {
      const res = await api.createOrganization(payload)
      if (res.data?.success) {
        const createdOrg = res.data.data?.organization
        if (res.data.data?.user) {
          setDbUser(res.data.data.user)
        } else {
          await refreshProfile()
        }
        if (createdOrg?.id) {
          switchOrganization(createdOrg.id)
        }
        completeOnboarding()
        return { success: true, organization: createdOrg }
      }
      return { success: false, message: res.data?.message || 'Failed to create organization' }
    } catch (err) {
      console.error('Create organization error:', err)
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  const acceptInvite = async (inviteId) => {
    try {
      const res = await api.acceptInvite(inviteId)
      if (res.data?.success) {
        const joinedOrg = res.data.data?.organization
        if (res.data.data?.user) {
          setDbUser(res.data.data.user)
        } else {
          await refreshProfile()
        }
        if (joinedOrg?.id) {
          switchOrganization(joinedOrg.id)
        }
        completeOnboarding()
        return { success: true, message: res.data?.message, organization: joinedOrg }
      }
      return { success: false, message: res.data?.message || 'Failed to join organization' }
    } catch (err) {
      console.error('Accept invite error:', err)
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  const declineInvite = async (inviteId) => {
    try {
      const res = await api.declineInvite(inviteId)
      if (res.data?.success) {
        if (res.data.data?.pendingInvites && dbUser) {
          setDbUser({ ...dbUser, pendingInvites: res.data.data.pendingInvites })
        } else {
          await refreshProfile()
        }
        return { success: true }
      }
      return { success: false, message: res.data?.message || 'Failed to decline invite' }
    } catch (err) {
      console.error('Decline invite error:', err)
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  const updateOrganization = async (orgId = 'active', payload = {}) => {
    try {
      const targetId = orgId === 'active' ? activeOrgId : orgId
      const res = await api.updateOrganizationSettings(targetId, payload)
      if (res.data?.success) {
        await refreshProfile()
        return { success: true, organization: res.data.data?.organization }
      }
      return { success: false, message: res.data?.message || 'Failed to update organization' }
    } catch (err) {
      console.error('Update organization error:', err)
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  const deleteOrganization = async (orgId = 'active') => {
    try {
      const targetId = orgId === 'active' ? activeOrgId : orgId
      const res = await api.deleteOrganization(targetId)
      if (res.data?.success) {
        const { nextOrgId, hasRemainingWorkspaces, remainingMemberships } = res.data.data || {}
        if (nextOrgId) {
          setActiveOrgId(nextOrgId)
          localStorage.setItem('seq_active_org_id', nextOrgId)
        } else {
          setActiveOrgId(null)
          localStorage.removeItem('seq_active_org_id')
          if (user?.id) {
            localStorage.removeItem(`seq_onboarded_${user.id}`)
          }
        }
        await refreshProfile()
        return { success: true, nextOrgId, hasRemainingWorkspaces, remainingMemberships }
      }
      return { success: false, message: res.data?.message || 'Failed to delete organization' }
    } catch (err) {
      console.error('Delete organization error:', err)
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // Derive active workspace data
  const memberships = dbUser?.memberships || []
  const pendingInvites = dbUser?.pendingInvites || []

  // Check onboarding status:
  // A user has completed onboarding ONLY if they actively belong to at least ONE valid organization!
  // If their only organization was deleted, they must be redirected to /onboard.
  const hasJoinedOrg = Array.isArray(memberships) && memberships.length > 0
  const hasCompletedOnboarding = hasJoinedOrg
  
  // Find active membership based on activeOrgId or fallback to the first/latest membership
  const activeMembership = (activeOrgId ? memberships.find(m => m.organizationId === activeOrgId || m.organization?.id === activeOrgId) : null) || (hasJoinedOrg ? memberships[0] : null)
  const org = activeMembership?.organization || null
  const userRole = activeMembership?.role || 'MEMBER'
  const isAdmin = userRole === 'ADMIN'
  const sub = org?.subscription || null
  const credits = org?.creditLedger?.reduce((acc, curr) => acc + (curr.amount || 0), 0) ?? 0

  // Auto-repair activeOrgId or clear if user has no organizations left
  useEffect(() => {
    if (org?.id) {
      if (org.id !== activeOrgId) {
        setActiveOrgId(org.id)
        localStorage.setItem('seq_active_org_id', org.id)
      }
    } else if (memberships.length === 0) {
      // If user has 0 memberships (e.g. invited org was deleted), clear activeOrgId & onboard flag
      if (activeOrgId) {
        setActiveOrgId(null)
        localStorage.removeItem('seq_active_org_id')
      }
      if (user?.id) {
        localStorage.removeItem(`seq_onboarded_${user.id}`)
      }
    }
  }, [org?.id, activeOrgId, memberships.length, user?.id])

  return (
    <AuthContext.Provider
      value={{
        dbUser,
        org,
        activeOrgId: org?.id || null,
        userRole,
        isAdmin,
        memberships,
        pendingInvites,
        hasCompletedOnboarding,
        credits,
        sub,
        syncStatus,
        isSyncing,
        isSwitchingOrg,
        refreshProfile,
        switchOrganization,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        acceptInvite,
        declineInvite,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

