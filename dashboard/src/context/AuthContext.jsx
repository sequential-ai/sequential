import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { api } from '@/api/client'

const AuthContext = createContext({
  dbUser: null,
  org: null,
  credits: 0,
  sub: null,
  apiKeys: [],
  syncStatus: 'idle',
  isSyncing: true,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [dbUser, setDbUser] = useState(null)
  const [syncStatus, setSyncStatus] = useState('Checking database...')
  const [isSyncing, setIsSyncing] = useState(true)

  const syncWithDatabase = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user) {
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
      }
    } catch (err) {
      console.warn('Profile refresh fallback:', err)
      await syncWithDatabase()
    }
  }

  // Derive active workspace data
  const membership = dbUser?.memberships?.[0]
  const org = membership?.organization || null
  const sub = org?.subscription || null
  const apiKeys = org?.apiKeys || []
  const credits = org?.creditLedger?.reduce((acc, curr) => acc + (curr.amount || 0), 0) ?? 3160

  return (
    <AuthContext.Provider
      value={{
        dbUser,
        org,
        credits,
        sub,
        apiKeys,
        syncStatus,
        isSyncing,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
