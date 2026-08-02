import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  toggle: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('seq-theme') || 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    let effectiveTheme = theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      effectiveTheme = prefersDark ? 'dark' : 'light'
    }

    root.classList.add(effectiveTheme)
    localStorage.setItem('seq-theme', theme)
  }, [theme])

  const toggle = () => setThemeState(t => (t === 'dark' ? 'light' : 'dark'))
  const setTheme = (newTheme) => setThemeState(newTheme)

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
