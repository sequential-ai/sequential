import React from 'react'
import { Outlet } from 'react-router-dom'
import SequentialAppSidebar from '@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar'

export default function DashboardLayout() {
  return (
    <SequentialAppSidebar>
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in min-w-0">
        <Outlet />
      </div>
    </SequentialAppSidebar>
  )
}
