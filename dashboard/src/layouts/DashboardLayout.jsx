import React from 'react'
import { Outlet } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import SequentialAppSidebar from '@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'

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
  const { isSyncing } = useAuth()

  return (
    <SequentialAppSidebar>
      <Skeleton
        name="dashboard-layout"
        loading={isSyncing}
        fallback={<DashboardLayoutFallback />}
        className="w-full min-w-0"
      >
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in min-w-0">
          <Outlet />
        </div>
      </Skeleton>
    </SequentialAppSidebar>
  )
}

