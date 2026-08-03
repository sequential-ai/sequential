import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import SequentialAppSidebar from '@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

function DashboardLayoutFallback() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <UiSkeleton className="h-8 w-48 rounded-lg" />
        <UiSkeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <UiSkeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <UiSkeleton className="h-72 rounded-2xl" />
    </div>
  )
}

export default function DashboardLayout() {
  const { isSyncing, hasCompletedOnboarding, memberships, org, activeOrgId } = useAuth()
  const location = useLocation()
  const isPlayground = location.pathname.startsWith('/dashboard/playground')

  // Flash notification banner (e.g. from workspace deletion / switching)
  const [flashNotice, setFlashNotice] = useState(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('seq_flash_notification')
      if (stored) {
        setFlashNotice(JSON.parse(stored))
        sessionStorage.removeItem('seq_flash_notification')
      }
    } catch {}
  }, [location.pathname, activeOrgId])

  // Redirect to /onboard when sync is complete and the user has no active workspace.
  // isSyncing stays true until Clerk + backend data are both ready, so this
  // will never fire prematurely on reload.
  if (!isSyncing && !hasCompletedOnboarding) {
    return <Navigate to="/onboard" replace />
  }

  return (
    <SequentialAppSidebar>
      <Skeleton
        name="dashboard-layout"
        loading={isSyncing}
        fallback={<DashboardLayoutFallback />}
        className={cn("w-full min-w-0", isPlayground && "h-full flex-1 flex flex-col")}
      >
        <div className={cn(
          "w-full min-w-0", 
          isPlayground 
            ? "h-full flex-1 flex flex-col min-h-0" 
            : "max-w-6xl mx-auto space-y-6 animate-fade-in"
        )}>
          {flashNotice && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in slide-in-from-top-2 duration-300 ${
              flashNotice.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                : flashNotice.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              <div className="flex items-center gap-2.5">
                {flashNotice.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                ) : flashNotice.type === 'warning' ? (
                  <Info className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                )}
                <div>
                  {flashNotice.title && (
                    <p className="font-semibold text-foreground text-xs">{flashNotice.title}</p>
                  )}
                  <p className="text-[11px] leading-relaxed opacity-90">{flashNotice.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFlashNotice(null)}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </Skeleton>
    </SequentialAppSidebar>
  )
}

