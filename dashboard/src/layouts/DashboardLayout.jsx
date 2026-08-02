import React from 'react'
import { Outlet } from 'react-router-dom'
import SequentialAppSidebar from '@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar'

export default function DashboardLayout() {
  return (
    <SequentialAppSidebar>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <Outlet />
      </div>
    </SequentialAppSidebar>
  )
}
