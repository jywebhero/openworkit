import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import type {
  InstalledSkill,
  InstallSkillInput,
  InstallSkillResult,
  SkillScanResult
} from '@shared/types'
import { api } from '@/lib/api'
import { useSettings } from './settings-provider'

interface SkillsContextValue {
  data: SkillScanResult | null
  skills: InstalledSkill[]
  installedSlugs: Set<string>
  loading: boolean
  refresh: () => Promise<void>
  toggle: (skill: InstalledSkill, enabled: boolean) => Promise<void>
  remove: (skill: InstalledSkill) => Promise<void>
  install: (input: InstallSkillInput) => Promise<InstallSkillResult>
  importFolder: () => Promise<InstallSkillResult | null>
  installDir: string
  openInstallDir: () => Promise<void>
}

const SkillsContext = createContext<SkillsContextValue | null>(null)

export function SkillsProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [data, setData] = useState<SkillScanResult | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.skills.scan())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handler = (): void => {
      void refresh()
    }
    window.addEventListener('openwork:rescan', handler)
    return () => window.removeEventListener('openwork:rescan', handler)
  }, [refresh])

  const dirSignature = JSON.stringify([
    settings.installDirId,
    settings.skillDirs.map((dir) => [dir.id, dir.path, dir.enabled])
  ])

  useEffect(() => {
    void refresh()
    // Re-scan whenever the configured directory set changes.
  }, [dirSignature, refresh])

  const toggle = useCallback(
    async (skill: InstalledSkill, enabled: boolean) => {
      setLoading(true)
      try {
        await api.skills.toggle(skill.path, enabled)
        setData(await api.skills.scan())
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const remove = useCallback(async (skill: InstalledSkill) => {
    setLoading(true)
    try {
      await api.skills.remove(skill.path)
      setData(await api.skills.scan())
    } finally {
      setLoading(false)
    }
  }, [])

  const install = useCallback(
    async (input: InstallSkillInput) => {
      const result = await api.skills.install(input)
      await refresh()
      return result
    },
    [refresh]
  )

  const importFolder = useCallback(async () => {
    const result = await api.skills.importFolder()
    if (result?.ok) await refresh()
    return result
  }, [refresh])

  const installDir = useMemo(() => {
    return settings.skillDirs.find((dir) => dir.id === settings.installDirId)?.path ?? ''
  }, [settings.installDirId, settings.skillDirs])

  const openInstallDir = useCallback(async () => {
    if (installDir) await api.app.openPath(installDir)
  }, [installDir])

  const skills = data?.skills ?? []
  const installedSlugs = useMemo(
    () => new Set(skills.map((skill) => skill.slug.toLowerCase())),
    [skills]
  )

  const value = useMemo(
    () => ({
      data,
      skills,
      installedSlugs,
      loading,
      refresh,
      toggle,
      remove,
      install,
      importFolder,
      installDir,
      openInstallDir
    }),
    [
      data,
      skills,
      installedSlugs,
      loading,
      refresh,
      toggle,
      remove,
      install,
      importFolder,
      installDir,
      openInstallDir
    ]
  )

  return <SkillsContext.Provider value={value}>{children}</SkillsContext.Provider>
}

export function useSkills(): SkillsContextValue {
  const context = useContext(SkillsContext)
  if (!context) throw new Error('useSkills must be used within SkillsProvider')
  return context
}
