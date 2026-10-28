import type {
  AppInfo,
  AppSettings,
  ConnectorScanResult,
  EnvEntry,
  InstallSkillInput,
  InstallSkillResult,
  MarketInstallResult,
  MarketListResult,
  MarketSummary,
  MarketView,
  ReadSkillResult,
  SkillScanResult
} from './types'

export interface Api {
  settings: {
    get: () => Promise<AppSettings>
    set: (patch: Partial<AppSettings>) => Promise<AppSettings>
    reset: () => Promise<AppSettings>
  }
  skills: {
    scan: () => Promise<SkillScanResult>
    toggle: (path: string, enabled: boolean) => Promise<SkillScanResult>
    remove: (path: string) => Promise<SkillScanResult>
    read: (path: string) => Promise<ReadSkillResult>
    install: (input: InstallSkillInput) => Promise<InstallSkillResult>
    importFolder: () => Promise<InstallSkillResult | null>
    pickDirectory: () => Promise<string | null>
    reveal: (path: string) => Promise<void>
    open: (path: string) => Promise<void>
  }
  market: {
    list: (view: MarketView) => Promise<MarketListResult>
    search: (query: string) => Promise<MarketListResult>
    describe: (
      items: Array<{ source: string; skillId: string }>
    ) => Promise<Record<string, MarketSummary>>
    onSummary: (
      handler: (summaries: Record<string, MarketSummary>) => void
    ) => () => void
    install: (source: string, skillId: string) => Promise<MarketInstallResult>
  }
  connectors: {
    scan: () => Promise<ConnectorScanResult>
    openConfig: (path: string) => Promise<void>
  }
  app: {
    info: () => Promise<AppInfo>
    env: () => Promise<EnvEntry[]>
    openExternal: (url: string) => Promise<void>
    openPath: (path: string) => Promise<void>
    revealPath: (path: string) => Promise<void>
    copyText: (text: string) => Promise<void>
    openDevTools: () => Promise<void>
  }
}
