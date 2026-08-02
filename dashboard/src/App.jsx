import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import { SignedIn, SignedOut } from '@clerk/clerk-react'

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login/*" element={<Login />} />
      <Route path="/signup/*" element={<Signup />} />

      {/* Protected Dashboard Route */}
      <Route path="/dashboard" element={
        <>
          <SignedIn>
            <Dashboard />
          </SignedIn>
          <SignedOut>
            <Navigate to="/login" replace />
          </SignedOut>
        </>
      } />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
