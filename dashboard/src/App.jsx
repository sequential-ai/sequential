import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboard from './pages/Onboard'
import DashboardLayout from './layouts/DashboardLayout'
import Overview from './pages/Overview'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/TaskDetail'
import Projects from './pages/Projects'
import ApiKeys from './pages/ApiKeys'
import Usage from './pages/Usage'
import Billing from './pages/Billing'
import Team from './pages/Team'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import AuditLogs from './pages/AuditLogs'
import Webhooks from './pages/Webhooks'
import Playground from './pages/Playground'
import Monitor from './pages/Monitor'

function PlaygroundRedirect() {
  const { tab } = useParams()
  return <Navigate to={`/dashboard/playground/${tab || 'task'}`} replace />
}

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login/*" element={<Login />} />
      <Route path="/signup/*" element={<Signup />} />

      {/* Top-Level Playground Shortcut Routes */}
      <Route path="/playground" element={<Navigate to="/dashboard/playground/task" replace />} />
      <Route path="/playground/:tab" element={<PlaygroundRedirect />} />

      {/* Onboarding Flow Route */}
      <Route
        path="/onboard"
        element={
          <>
            <SignedIn>
              <Onboard />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      />

      {/* Protected Dashboard Shell Routes */}
      <Route
        path="/dashboard"
        element={
          <>
            <SignedIn>
              <DashboardLayout />
            </SignedIn>
            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      >
        <Route index element={<Overview />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="playground" element={<Navigate to="/dashboard/playground/task" replace />} />
        <Route path="playground/:tab" element={<Playground />} />
        <Route path="monitor" element={<Monitor />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
        <Route path="projects" element={<Projects />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="webhooks" element={<Webhooks />} />
        <Route path="usage" element={<Usage />} />
        <Route path="billing" element={<Billing />} />
        <Route path="team" element={<Team />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Default Fallback Route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
