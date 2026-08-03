import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { TooltipProvider } from '@/components/ui/tooltip'

import { configureBoneyard } from 'boneyard-js/react'
import './bones/registry'

// Configure global Boneyard skeleton defaults
configureBoneyard({
  color: '#F2EDE3',
  darkColor: '#18181b',
  animate: 'shimmer',
  shimmerColor: '#FAF8F5',
  darkShimmerColor: '#27272a',
  speed: '1.8s',
  shimmerAngle: 110,
  transition: true,
  stagger: true,
})

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file.")
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <App />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)

