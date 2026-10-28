import { app, nativeTheme } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { AppSettings, Language, SkillDirConfig, ThemeMode } from '../shared/types'

let cache: AppSettings | null = null

export function settingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

function tildify(p: string): string {
  const home = os.homedir()
  return p.startsWith(home) ? `~${p.slice(home.length)}` : p
}

const SETTINGS_VERSION = 2

const AGENT_DIRS: Array<{ id: string; segments: string[] }> = [
  { id: 'user-codex', segments: ['.codex', 'skills'] },
  { id: 'user-gemini', segments: ['.gemini', 'skills'] },
  { id: 'user-opencode', segments: ['.config', 'opencode', 'skills'] },
  { id: 'user-pi', segments: ['.pi', 'agent', 'skills'] },
  { id: 'user-trae', segments: ['.trae', 'skills'] },
  { id: 'user-trae-cn', segments: ['.trae-cn', 'skills'] },
  { id: 'user-kimi-work', segments: ['.kimi-work', 'skills'] },
  { id: 'user-kimi-code', segments: ['.kimi-code', 'skills'] },
  { id: 'user-qwenwork', segments: ['.qwenwork', 'skills'] },
  { id: 'user-qwenworkcn', segments: ['.qwenworkcn', 'skills'] },
  { id: 'user-workbuddy', segments: ['.workbuddy', 'skills'] },
  { id: 'user-doubao', segments: ['Doubao', 'skills'] },
  { id: 'user-zcode', segments: ['.zcode', 'skills'] }
]

function agentSkillDir(id: string, segments: string[]): SkillDirConfig {
  const abs = path.join(os.homedir(), ...segments)
  return {
    id,
    label: tildify(abs),
    path: abs,
    enabled: true,
    scope: 'user'
  }
}

function agentDirsAbsentFrom(existing: SkillDirConfig[]): SkillDirConfig[] {
  const known = new Set(existing.map((dir) => path.normalize(dir.path)))
  return AGENT_DIRS.filter(
    (spec) => !known.has(path.normalize(path.join(os.homedir(), ...spec.segments)))
  ).map((spec) => agentSkillDir(spec.id, spec.segments))
}

function defaultSkillDirs(): SkillDirConfig[] {
  const home = os.homedir()
  const projectRoot = process.cwd()
  const dirs: SkillDirConfig[] = [
    {
      id: 'user-agents',
      label: tildify(path.join(home, '.agents', 'skills')),
      path: path.join(home, '.agents', 'skills'),
      enabled: true,
      scope: 'user'
    },
    {
      id: 'user-claude',
      label: tildify(path.join(home, '.claude', 'skills')),
      path: path.join(home, '.claude', 'skills'),
      enabled: true,
      scope: 'user'
    },
    {
      id: 'user-qoder',
      label: tildify(path.join(home, '.qoder-cn', 'skills')),
      path: path.join(home, '.qoder-cn', 'skills'),
      enabled: true,
      scope: 'user'
    }
  ]

  dirs.push(...agentDirsAbsentFrom(dirs))

  for (const candidate of ['.agents/skills', '.claude/skills']) {
    const abs = path.join(projectRoot, candidate)
    if (existsSync(abs)) {
      dirs.push({
        id: `project-${candidate.split('/')[0].replace('.', '')}`,
        label: `${path.basename(projectRoot)}/${candidate}`,
        path: abs,
        enabled: true,
        scope: 'project'
      })
    }
  }

  return dirs
}

export function defaultSettings(): AppSettings {
  return {
    settingsVersion: SETTINGS_VERSION,
    theme: 'system',
    language: 'system',
    compact: false,
    confirmDelete: true,
    autoScan: true,
    installDirId: 'user-agents',
    updateChannel: 'stable',
    skillDirs: defaultSkillDirs()
  }
}

const THEMES: ThemeMode[] = ['system', 'light', 'dark']
const LANGUAGES: Language[] = ['system', 'zh', 'en']

function sanitize(raw: Partial<AppSettings>): AppSettings {
  const base = defaultSettings()
  const version = typeof raw.settingsVersion === 'number' ? raw.settingsVersion : 1
  const dirs = Array.isArray(raw.skillDirs)
    ? raw.skillDirs
        .filter(
          (d): d is SkillDirConfig =>
            !!d && typeof d.path === 'string' && d.path.length > 0 && typeof d.id === 'string'
        )
        .map(
          (d): SkillDirConfig => ({
            id: d.id,
            label: typeof d.label === 'string' && d.label ? d.label : tildify(d.path),
            path: d.path,
            enabled: d.enabled !== false,
            scope: d.scope === 'project' ? 'project' : 'user'
          })
        )
    : base.skillDirs

  const migrated = version < SETTINGS_VERSION ? [...dirs, ...agentDirsAbsentFrom(dirs)] : dirs

  const settings: AppSettings = {
    settingsVersion: SETTINGS_VERSION,
    theme: THEMES.includes(raw.theme as ThemeMode) ? (raw.theme as ThemeMode) : base.theme,
    language: LANGUAGES.includes(raw.language as Language) ? (raw.language as Language) : base.language,
    compact: typeof raw.compact === 'boolean' ? raw.compact : base.compact,
    confirmDelete: typeof raw.confirmDelete === 'boolean' ? raw.confirmDelete : base.confirmDelete,
    autoScan: typeof raw.autoScan === 'boolean' ? raw.autoScan : base.autoScan,
    installDirId: typeof raw.installDirId === 'string' ? raw.installDirId : base.installDirId,
    updateChannel: raw.updateChannel === 'beta' ? 'beta' : 'stable',
    skillDirs: migrated.length > 0 ? migrated : base.skillDirs
  }

  if (!settings.skillDirs.some((d) => d.id === settings.installDirId)) {
    settings.installDirId = settings.skillDirs[0].id
  }

  return settings
}

export function getSettings(): AppSettings {
  if (cache) return cache
  try {
    const raw = JSON.parse(readFileSync(settingsPath(), 'utf8')) as Partial<AppSettings>
    const next = sanitize(raw)
    cache = next
    if ((raw.settingsVersion ?? 1) < SETTINGS_VERSION) persist(next)
  } catch {
    cache = defaultSettings()
  }
  return cache
}

function persist(settings: AppSettings): void {
  const file = settingsPath()
  mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
  renameSync(tmp, file)
  cache = settings
}

export function applyTheme(theme: ThemeMode): void {
  nativeTheme.themeSource = theme
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const next = sanitize({ ...getSettings(), ...patch })
  persist(next)
  applyTheme(next.theme)
  return next
}

export function resetSettings(): AppSettings {
  const next = defaultSettings()
  persist(next)
  applyTheme(next.theme)
  return next
}

export function ensureSettingsLoaded(): AppSettings {
  const settings = getSettings()
  applyTheme(settings.theme)
  return settings
}
