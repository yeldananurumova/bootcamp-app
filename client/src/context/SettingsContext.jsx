import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getSettings } from '../api/settings.js'

const SettingsContext = createContext(null)

const THEME_CACHE_KEY = 'bootcamp-app:last-theme'

function resolveEffectiveTheme(theme) {
  if (theme === 'dark' || theme === 'light') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const effective = resolveEffectiveTheme(theme)
  document.documentElement.setAttribute('data-theme', effective)
  try {
    localStorage.setItem(THEME_CACHE_KEY, theme)
  } catch {
    // localStorage unavailable — theme just won't persist across a hard reload before the API responds
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const data = await getSettings()
      setSettings(data)
      setError(null)
      applyTheme(data.theme)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    try {
      const cached = localStorage.getItem(THEME_CACHE_KEY)
      if (cached) applyTheme(cached)
    } catch {
      // ignore — falls back to the default theme until the API responds
    }
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!settings || settings.theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [settings])

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refresh }}>{children}</SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}
