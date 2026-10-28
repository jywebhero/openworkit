export type Scope = 'user' | 'project'

export interface SkillDirConfig {
  id: string
  label: string
  path: string
  enabled: boolean
  scope: Scope
}

export type ThemeMode = 'system' | 'light' | 'dark'
export type Language = 'system' | 'zh' | 'en'

export interface AppSettings {
  settingsVersion: number
  theme: ThemeMode
  language: Language
  compact: boolean
  confirmDelete: boolean
  autoScan: boolean
  installDirId: string
  updateChannel: 'stable' | 'beta'
  skillDirs: SkillDirConfig[]
}

export interface SkillMeta {
  name: string
  description: string
  version?: string
  license?: string
  allowedTools: string[]
  extra: Record<string, string>
}

export interface InstalledSkill {
  id: string
  dirId: string
  dirLabel: string
  dirPath: string
  scope: Scope
  path: string
  folder: string
  slug: string
  enabled: boolean
  meta: SkillMeta
  bodyPreview: string
  files: number
  bytes: number
  mtimeMs: number
  hasFrontmatter: boolean
  isSymlink: boolean
  linkTarget?: string
}

export interface SkillDirStatus extends SkillDirConfig {
  exists: boolean
  count: number
  isInstallTarget: boolean
}

export interface SkillScanResult {
  skills: InstalledSkill[]
  dirs: SkillDirStatus[]
  scannedAt: number
}

export interface InstallSkillInput {
  slug: string
  name: string
  description: string
  body?: string
  version?: string
  dirId?: string
}

export type InstallSkillError = 'exists' | 'invalid' | 'io' | 'no-dir'

export interface InstallSkillResult {
  ok: boolean
  path?: string
  error?: InstallSkillError
}

export interface ReadSkillResult {
  path: string
  content: string
}

export type MarketView = 'recommended' | 'trending' | 'hot' | 'official'

export interface MarketSkill {
  id: string
  source: string
  skillId: string
  name: string
  installs: number
  weekly?: number
  yesterday?: number
  change?: number
  official: boolean
  github: boolean
  url: string
}

export interface MarketSummary {
  description: string
  command: string
}

export interface MarketListResult {
  view: MarketView | 'search'
  query?: string
  skills: MarketSkill[]
  fetchedAt: number
}

export type MarketInstallError =
  | 'exists'
  | 'invalid'
  | 'io'
  | 'no-dir'
  | 'unsupported'
  | 'not-found'
  | 'network'

export interface MarketInstallResult {
  ok: boolean
  path?: string
  error?: MarketInstallError
  command?: string
}

export type ConnectorTransport = 'stdio' | 'http' | 'sse' | 'unknown'

export interface ConnectorServer {
  id: string
  name: string
  transport: ConnectorTransport
  command?: string
  url?: string
  source: string
  scope: Scope
  agent: string | null
}

export interface ConnectorFile {
  path: string
  count: number
  agent: string | null
}

export interface ConnectorScanResult {
  files: ConnectorFile[]
  servers: ConnectorServer[]
}

export interface AppInfo {
  name: string
  version: string
  electron: string
  chrome: string
  node: string
  platform: string
  arch: string
  userData: string
  configPath: string
  logsPath: string
  appPath: string
  installDir: string
}

export interface EnvEntry {
  key: string
  value: string
}
