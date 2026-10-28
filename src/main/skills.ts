import { promises as fs } from 'node:fs'
import path from 'node:path'
import { shell } from 'electron'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type {
  AppSettings,
  InstalledSkill,
  InstallSkillInput,
  InstallSkillResult,
  ReadSkillResult,
  SkillDirStatus,
  SkillMeta,
  SkillScanResult
} from '../shared/types'

export const DISABLED_SUFFIX = '.disabled'
const SKILL_FILE_CANDIDATES = ['SKILL.md', 'skill.md', 'Skill.md']
const MAX_SKILL_BYTES = 512 * 1024
const MAX_MEASURE_DEPTH = 4
const MAX_MEASURE_FILES = 800

async function statSafe(p: string) {
  try {
    return await fs.stat(p)
  } catch {
    return null
  }
}

export async function findSkillFile(dir: string): Promise<string | null> {
  for (const name of SKILL_FILE_CANDIDATES) {
    const candidate = path.join(dir, name)
    const stat = await statSafe(candidate)
    if (stat?.isFile()) return candidate
  }
  try {
    const entries = await fs.readdir(dir)
    const hit = entries.find((entry) => entry.toLowerCase() === 'skill.md')
    if (hit) {
      const candidate = path.join(dir, hit)
      const stat = await statSafe(candidate)
      if (stat?.isFile()) return candidate
    }
  } catch {
    // unreadable directory: treated as a non-skill
  }
  return null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

export function parseSkillFile(raw: string): {
  frontmatter: Record<string, unknown>
  body: string
} {
  const normalized = raw.replace(/^\uFEFF/, '')
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(normalized)
  if (!match) return { frontmatter: {}, body: normalized }

  let frontmatter: Record<string, unknown> = {}
  try {
    frontmatter = asRecord(parseYaml(match[1]))
  } catch {
    frontmatter = {}
  }

  return { frontmatter, body: normalized.slice(match[0].length) }
}

function normalizeMeta(frontmatter: Record<string, unknown>, fallbackName: string): SkillMeta {
  const metadata = asRecord(frontmatter.metadata)
  const rawTools =
    frontmatter['allowed-tools'] ?? frontmatter.allowedTools ?? frontmatter.allowed_tools ?? metadata['allowed-tools']

  const allowedTools = Array.isArray(rawTools)
    ? rawTools.map(asString).filter(Boolean)
    : typeof rawTools === 'string'
      ? rawTools
          .split(',')
          .map((tool) => tool.trim())
          .filter(Boolean)
      : []

  const extra: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    const text = asString(value)
    if (text) extra[key] = text
  }

  return {
    name: asString(frontmatter.name) || fallbackName,
    description: asString(frontmatter.description) || asString(metadata.description),
    version: asString(frontmatter.version) || asString(metadata.version) || undefined,
    license: asString(frontmatter.license) || undefined,
    allowedTools,
    extra
  }
}

async function measure(dir: string): Promise<{ files: number; bytes: number }> {
  let files = 0
  let bytes = 0

  async function walk(current: string, depth: number): Promise<void> {
    if (depth > MAX_MEASURE_DEPTH || files >= MAX_MEASURE_FILES) return
    let entries
    try {
      entries = await fs.readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (files >= MAX_MEASURE_FILES) return
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const next = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(next, depth + 1)
      } else if (entry.isFile()) {
        const stat = await statSafe(next)
        if (stat) {
          files += 1
          bytes += stat.size
        }
      }
    }
  }

  await walk(dir, 0)
  return { files, bytes }
}

async function loadSkill(
  dir: SkillDirStatus,
  folder: string,
  enabled: boolean
): Promise<InstalledSkill | null> {
  const absolute = path.join(dir.path, folder)
  const skillFile = await findSkillFile(absolute)
  if (!skillFile) return null

  const stat = await statSafe(absolute)
  if (!stat) return null

  let isSymlink = false
  let linkTarget: string | undefined
  try {
    const lstat = await fs.lstat(absolute)
    if (lstat.isSymbolicLink()) {
      isSymlink = true
      linkTarget = path.resolve(dir.path, await fs.readlink(absolute))
    }
  } catch {
    // treat unreadable link metadata as a regular directory
  }

  let raw = ''
  try {
    raw = await fs.readFile(skillFile, 'utf8')
  } catch {
    return null
  }

  const { frontmatter, body } = parseSkillFile(raw.slice(0, MAX_SKILL_BYTES))
  const folderBase = enabled ? folder : folder.slice(0, -DISABLED_SUFFIX.length)
  const { files, bytes } = await measure(absolute)

  return {
    id: `${dir.id}:${folder}`,
    dirId: dir.id,
    dirLabel: dir.label,
    dirPath: dir.path,
    scope: dir.scope,
    path: absolute,
    folder,
    slug: folderBase,
    enabled,
    meta: normalizeMeta(frontmatter, folderBase),
    bodyPreview: body.trim().replace(/\s+/g, ' ').slice(0, 220),
    files,
    bytes,
    mtimeMs: stat.mtimeMs,
    hasFrontmatter: Object.keys(frontmatter).length > 0,
    isSymlink,
    linkTarget
  }
}

export async function scanSkills(settings: AppSettings): Promise<SkillScanResult> {
  const skills: InstalledSkill[] = []
  const dirs: SkillDirStatus[] = []

  for (const config of settings.skillDirs) {
    const stat = await statSafe(config.path)
    const status: SkillDirStatus = {
      ...config,
      exists: !!stat?.isDirectory(),
      count: 0,
      isInstallTarget: config.id === settings.installDirId
    }
    dirs.push(status)

    if (!stat?.isDirectory() || !config.enabled) continue

    let entries
    try {
      entries = await fs.readdir(config.path, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
      if (entry.name.startsWith('.')) continue
      const enabled = !entry.name.endsWith(DISABLED_SUFFIX)
      if (!enabled && entry.name.length <= DISABLED_SUFFIX.length) continue
      const skill = await loadSkill(status, entry.name, enabled)
      if (skill) {
        skills.push(skill)
        status.count += 1
      }
    }
  }

  skills.sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
    return a.meta.name.localeCompare(b.meta.name)
  })

  return { skills, dirs, scannedAt: Date.now() }
}

function resolveRoot(settings: AppSettings, target: string): string {
  const resolved = path.resolve(target)
  const root = path.dirname(resolved)
  const allowed = settings.skillDirs.some((dir) => path.resolve(dir.path) === root)
  if (!allowed) throw new Error('Path is outside the configured skill directories')
  return root
}

export async function toggleSkill(
  settings: AppSettings,
  target: string,
  enabled: boolean
): Promise<void> {
  const resolved = path.resolve(target)
  const root = resolveRoot(settings, resolved)
  const name = path.basename(resolved)
  const base = name.endsWith(DISABLED_SUFFIX) ? name.slice(0, -DISABLED_SUFFIX.length) : name
  const next = path.join(root, enabled ? base : `${base}${DISABLED_SUFFIX}`)

  if (path.resolve(next) === resolved) return
  if (await statSafe(next)) throw new Error(`${enabled ? base : `${base}${DISABLED_SUFFIX}`} already exists`)

  await fs.rename(resolved, next)
}

export async function removeSkill(settings: AppSettings, target: string): Promise<void> {
  const resolved = path.resolve(target)
  resolveRoot(settings, resolved)
  await shell.trashItem(resolved)
}

export async function readSkill(settings: AppSettings, target: string): Promise<ReadSkillResult> {
  const resolved = path.resolve(target)
  const root = resolveRoot(settings, resolved)
  const skillFile = await findSkillFile(resolved)
  if (!skillFile) throw new Error('SKILL.md not found')
  const within = path.resolve(skillFile).startsWith(`${root}${path.sep}`)
  if (!within) throw new Error('Path is outside the configured skill directories')
  const content = await fs.readFile(skillFile, 'utf8')
  return { path: skillFile, content }
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .slice(0, 64)
}

function skillDocument(input: InstallSkillInput & { slug: string }): string {
  const frontmatter = stringifyYaml({
    name: input.slug,
    description: input.description,
    version: input.version || '1.0.0'
  }).trim()
  const body =
    input.body?.trim() ||
    `# ${input.name}\n\n${input.description}\n\n## Usage\n\nDescribe when the agent should reach for this skill and the steps it should follow.\n`
  return `---\n${frontmatter}\n---\n\n${body}\n`
}

export async function installSkill(
  settings: AppSettings,
  input: InstallSkillInput
): Promise<InstallSkillResult> {
  const slug = sanitizeSlug(input.slug || input.name)
  if (!slug) return { ok: false, error: 'invalid' }

  const dirId = input.dirId || settings.installDirId
  const dir = settings.skillDirs.find((entry) => entry.id === dirId)
  if (!dir) return { ok: false, error: 'no-dir' }

  const destination = path.join(dir.path, slug)
  if (await statSafe(destination)) return { ok: false, error: 'exists' }

  try {
    await fs.mkdir(dir.path, { recursive: true })
    await fs.mkdir(destination)
    await fs.writeFile(path.join(destination, 'SKILL.md'), skillDocument({ ...input, slug }), 'utf8')
    return { ok: true, path: destination }
  } catch {
    await fs.rm(destination, { recursive: true, force: true }).catch(() => undefined)
    return { ok: false, error: 'io' }
  }
}

export async function installSkillFromFiles(
  settings: AppSettings,
  slug: string,
  files: Array<{ path: string; data: Uint8Array }>
): Promise<InstallSkillResult> {
  if (!slug) return { ok: false, error: 'invalid' }
  if (!files.some((file) => file.path.toLowerCase() === 'skill.md')) {
    return { ok: false, error: 'invalid' }
  }

  const dir = settings.skillDirs.find((entry) => entry.id === settings.installDirId)
  if (!dir) return { ok: false, error: 'no-dir' }

  const destination = path.join(dir.path, slug)
  const destinationRoot = path.resolve(destination)
  if (await statSafe(destination)) return { ok: false, error: 'exists' }

  try {
    await fs.mkdir(dir.path, { recursive: true })
    await fs.mkdir(destination)
    for (const file of files) {
      const relative = file.path.replace(/\\/g, '/').replace(/^\/+/, '')
      if (!relative) continue
      const target = path.resolve(destination, ...relative.split('/'))
      if (!target.startsWith(`${destinationRoot}${path.sep}`)) continue
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, file.data)
    }
    return { ok: true, path: destination }
  } catch {
    await fs.rm(destination, { recursive: true, force: true }).catch(() => undefined)
    return { ok: false, error: 'io' }
  }
}

export async function importSkillFolder(
  settings: AppSettings,
  source: string,
  dirId?: string
): Promise<InstallSkillResult> {
  const skillFile = await findSkillFile(source)
  if (!skillFile) return { ok: false, error: 'invalid' }

  const targetDir = settings.skillDirs.find((entry) => entry.id === (dirId || settings.installDirId))
  if (!targetDir) return { ok: false, error: 'no-dir' }

  const slug = sanitizeSlug(path.basename(source))
  if (!slug) return { ok: false, error: 'invalid' }

  const destination = path.join(targetDir.path, slug)
  const sourceResolved = path.resolve(source)
  if (sourceResolved === path.resolve(destination)) return { ok: false, error: 'exists' }
  if (await statSafe(destination)) return { ok: false, error: 'exists' }

  try {
    await fs.mkdir(targetDir.path, { recursive: true })
    await fs.cp(source, destination, { recursive: true, errorOnExist: true, force: false })
    return { ok: true, path: destination }
  } catch {
    await fs.rm(destination, { recursive: true, force: true }).catch(() => undefined)
    return { ok: false, error: 'io' }
  }
}
