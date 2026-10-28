import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import type { AppSettings } from '@shared/types'
import i18n from '@/i18n'
import { api } from '@/lib/api'

const fallback: AppSettings = {
  settingsVersion: 2,
  theme: 'system',
  language: 'system',
  compact: false,
  confirmDelete: true,
  autoScan: true,
  installDirId: '',
  updateChannel: 'stable',
  skillDirs: []
}

interface SettingsContextValue {
  settings: AppSettings
  ready: boolean
  isDark: boolean
  update: (patch: Partial<AppSettings>) => Promise<AppSettings>
  reset: () => Promise<AppSettings>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function detectLanguage(language: AppSettings['language']): 'zh' | 'en' {
  if (language === 'system') {
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
  }
  return language
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(fallback)
  const [ready, setReady] = useState(false)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    let active = true
    void api.settings
      .get()
      .then((next) => {
        if (active) {
          setSettings(next)
          setReady(true)
        }
      })
      .catch(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent): void => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [isDark])

  useEffect(() => {
    document.documentElement.dataset.compact = settings.compact ? 'true' : 'false'
  }, [settings.compact])

  useEffect(() => {
    const lang = detectLanguage(settings.language)
    if (i18n.language !== lang) void i18n.changeLanguage(lang)
  }, [settings.language])

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await api.settings.set(patch)
    setSettings(next)
    return next
  }, [])

  const reset = useCallback(async () => {
    const next = await api.settings.reset()
    setSettings(next)
    return next
  }, [])

  const value = useMemo(
    () => ({ settings, ready, isDark, update, reset }),
    [settings, ready, isDark, update, reset]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}
