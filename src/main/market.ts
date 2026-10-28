import type {
  AppSettings,
  MarketInstallResult,
  MarketListResult,
  MarketSkill,
  MarketSummary,
  MarketView
} from '../shared/types'
import { installSkillFromFiles, sanitizeSlug } from './skills'

const MARKET_ORIGIN = 'https://www.skills.sh'
const LIST_TTL = 60_000
const SUMMARY_TTL = 10 * 60_000
const SUMMARY_FAIL_TTL = 60_000
const REPO_TTL = 30 * 60_000
const GITHUB_SOURCE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const MAX_EXTRA_FILES = 120
const MAX_FILE_BYTES = 1024 * 1024
const MAX_TOTAL_BYTES = 5 * 1024 * 1024
const LIST_LIMIT = 60

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) OpenWorkit/0.1'

interface RawSkill {
  source: string
  skillId: string
  name: string
  installs?: number
  weeklyInstalls?: number[]
  installsYesterday?: number
  change?: number
  isOfficial?: boolean
}

interface RepoFile {
  path: string
  size: number
}

interface RepoSnapshot {
  ref: string
  files: RepoFile[]
}

interface Cached<T> {
  value: T
  expires: number
}

const listCache = new Map<string, Cached<RawSkill[]>>()
const summaryCache = new Map<string, Cached<MarketSummary>>()
const repoCache = new Map<string, Cached<RepoSnapshot | null>>()

async function fetchText(url: string, timeout = 15_000): Promise<string> {
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
    signal: AbortSignal.timeout(timeout),
    redirect: 'follow'
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

async function fetchJson(url: string, timeout = 15_000): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
    signal: AbortSignal.timeout(timeout),
    redirect: 'follow'
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function bracketEnd(text: string, start: number): number {
  let depth = 0
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (char === '[') depth += 1
    else if (char === ']') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

function readFlightArray(html: string, key: string): unknown[] | null {
  let from = 0
  while (from < html.length) {
    const at = html.indexOf(key, from)
    if (at === -1) return null
    from = at + key.length
    const colon = html.indexOf(':', from)
    if (colon === -1) return null
    if (colon - from > 4) continue
    const start = html.indexOf('[', colon)
    if (start === -1 || start - colon > 4) continue
    const end = bracketEnd(html, start)
    if (end === -1) continue
    try {
      const parsed: unknown = JSON.parse(html.slice(start, end + 1).replace(/\\"/g, '"'))
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      // keep looking for the next occurrence
    }
  }
  return null
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function isGithubSource(source: string): boolean {
  return GITHUB_SOURCE.test(source)
}

function skillUrl(source: string, skillId: string): string {
  const encoded = `${source}/${skillId}`.split('/').map(encodeURIComponent).join('/')
  return isGithubSource(source) ? `${MARKET_ORIGIN}/${encoded}` : `${MARKET_ORIGIN}/site/${encoded}`
}

function normalizeRaw(value: unknown): RawSkill | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const source = typeof record.source === 'string' ? record.source.trim() : ''
  const skillId = typeof record.skillId === 'string' ? record.skillId.trim() : ''
  if (!source || !skillId) return null
  return {
    source,
    skillId,
    name: typeof record.name === 'string' && record.name.trim() ? record.name.trim() : skillId,
    installs: toNumber(record.installs),
    weeklyInstalls: Array.isArray(record.weeklyInstalls)
      ? record.weeklyInstalls.filter((entry): entry is number => typeof entry === 'number')
      : undefined,
    installsYesterday: toNumber(record.installsYesterday),
    change: toNumber(record.change),
    isOfficial: record.isOfficial === true
  }
}

function toMarketSkill(raw: RawSkill): MarketSkill {
  const weekly =
    raw.weeklyInstalls && raw.weeklyInstalls.length > 0
      ? raw.weeklyInstalls[raw.weeklyInstalls.length - 1]
      : undefined
  return {
    id: `${raw.source}/${raw.skillId}`,
    source: raw.source,
    skillId: raw.skillId,
    name: raw.name,
    installs: raw.installs ?? 0,
    weekly,
    yesterday: raw.installsYesterday,
    change: raw.change,
    official: raw.isOfficial === true,
    github: isGithubSource(raw.source),
    url: skillUrl(raw.source, raw.skillId)
  }
}

function pageForView(view: MarketView): string | null {
  if (view === 'trending') return '/trending'
  if (view === 'hot') return '/hot'
  if (view === 'recommended' || view === 'official') return '/'
  return null
}

async function fetchRankedRaw(path: string): Promise<RawSkill[]> {
  const cached = listCache.get(path)
  if (cached && cached.expires > Date.now()) return cached.value
  const html = await fetchText(`${MARKET_ORIGIN}${path}`)
  const raw = (readFlightArray(html, 'initialSkills') ?? [])
    .map(normalizeRaw)
    .filter((entry): entry is RawSkill => entry !== null)
  if (raw.length === 0) throw new Error('skills.sh returned an unexpected payload')
  listCache.set(path, { value: raw, expires: Date.now() + LIST_TTL })
  return raw
}

export async function listMarket(view: MarketView): Promise<MarketListResult> {
  const path = pageForView(view)
  if (!path) throw new Error('Unknown market view')
  const raw = await fetchRankedRaw(path)
  const skills = raw
    .map(toMarketSkill)
    .filter((skill) => (view === 'official' ? skill.official : true))
  return { view, skills, fetchedAt: Date.now() }
}

export async function searchMarket(query: string): Promise<MarketListResult> {
  const needle = query.trim().slice(0, 120)
  if (needle.length < 2) throw new Error('Query is too short')
  const url = `${MARKET_ORIGIN}/api/search?q=${encodeURIComponent(needle)}&limit=${LIST_LIMIT}`
  const payload = (await fetchJson(url)) as { skills?: unknown }
  const skills = (Array.isArray(payload.skills) ? payload.skills : [])
    .map(normalizeRaw)
    .filter((entry): entry is RawSkill => entry !== null)
    .map(toMarketSkill)
  return { view: 'search', query: needle, skills, fetchedAt: Date.now() }
}

function metaDescription(html: string): string {
  const meta = /<meta[^>]*name="description"[^>]*content="([^"]*)"/i.exec(html)
  if (!meta) return ''
  return decodeEntities(meta[1]).trim()
}

function installCommand(html: string): string {
  const text = html.replace(/<!--\s*-->/g, '')
  const match = /npx skills add\s+[^<]+/.exec(text)
  return match ? decodeEntities(match[0]).trim() : ''
}

async function summaryFor(source: string, skillId: string): Promise<MarketSummary> {
  const key = `${source}/${skillId}`
  const cached = summaryCache.get(key)
  if (cached && cached.expires > Date.now()) return cached.value

  try {
    const html = await fetchText(skillUrl(source, skillId), 12_000)
    const value: MarketSummary = {
      description: metaDescription(html),
      command: installCommand(html)
    }
    summaryCache.set(key, { value, expires: Date.now() + SUMMARY_TTL })
    return value
  } catch {
    const empty: MarketSummary = { description: '', command: '' }
    summaryCache.set(key, { value: empty, expires: Date.now() + SUMMARY_FAIL_TTL })
    return empty
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await task(items[index])
    }
  })
  await Promise.all(workers)
  return results
}

export async function describeMarket(
  items: Array<{ source: string; skillId: string }>,
  onSummary?: (summaries: Record<string, MarketSummary>) => void
): Promise<Record<string, MarketSummary>> {
  const unique = new Map<string, { source: string; skillId: string }>()
  for (const item of items) {
    if (!item || typeof item.source !== 'string' || typeof item.skillId !== 'string') continue
    unique.set(`${item.source}/${item.skillId}`, item)
  }
  const out: Record<string, MarketSummary> = {}
  await mapLimit([...unique.entries()], 8, async ([key, item]) => {
    const summary = await summaryFor(item.source, item.skillId)
    out[key] = summary
    onSummary?.({ [key]: summary })
  })
  return out
}

function jsdelivrSource(source: string): string {
  return source
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

async function flatRepo(source: string, ref: string): Promise<RepoSnapshot | null> {
  const payload = (await fetchJson(
    `https://data.jsdelivr.com/v1/package/gh/${jsdelivrSource(source)}@${encodeURIComponent(ref)}/flat`
  )) as { files?: unknown }
  if (!Array.isArray(payload.files)) return null
  const files: RepoFile[] = []
  for (const entry of payload.files) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    if (typeof record.name !== 'string') continue
    files.push({ path: record.name, size: toNumber(record.size) ?? 0 })
  }
  return files.length > 0 ? { ref, files } : null
}

async function resolveRepo(source: string): Promise<RepoSnapshot | null> {
  const cached = repoCache.get(source)
  if (cached && cached.expires > Date.now()) return cached.value

  const tryRefs = async (refs: string[]): Promise<RepoSnapshot | null> => {
    for (const ref of [...new Set(refs)]) {
      try {
        const snapshot = await flatRepo(source, ref)
        if (snapshot) return snapshot
      } catch {
        // try the next ref
      }
    }
    return null
  }

  let snapshot = await tryRefs(['main', 'master'])
  if (!snapshot) {
    try {
      const repo = (await fetchJson(`https://api.github.com/repos/${source}`)) as {
        default_branch?: unknown
      }
      if (typeof repo.default_branch === 'string' && repo.default_branch) {
        snapshot = await tryRefs([repo.default_branch])
      }
    } catch {
      // the repository is not reachable through jsDelivr
    }
  }

  repoCache.set(source, {
    value: snapshot,
    expires: Date.now() + (snapshot ? REPO_TTL : SUMMARY_FAIL_TTL)
  })
  return snapshot
}

function findSkillPath(files: RepoFile[], skillId: string): string | null {
  const candidates = files.filter((file) => /(^|\/)SKILL\.md$/i.test(file.path))
  if (candidates.length === 0) return null

  const wanted = skillId.toLowerCase()
  const exact = candidates
    .filter((file) => {
      const folder = file.path.replace(/\/SKILL\.md$/i, '')
      return folder.split('/').pop()?.toLowerCase() === wanted
    })
    .sort((a, b) => a.path.length - b.path.length)
  if (exact.length > 0) return exact[0].path

  const root = candidates.find((file) => file.path.toLowerCase() === '/skill.md')
  if (root) return root.path
  if (candidates.length === 1) return candidates[0].path
  return null
}

async function fetchRepoFile(source: string, ref: string, filePath: string): Promise<Uint8Array> {
  const encoded = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  const hosts = ['https://cdn.jsdelivr.net', 'https://gcore.jsdelivr.net']
  let lastError: unknown = null
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/gh/${jsdelivrSource(source)}@${encodeURIComponent(ref)}${encoded}`, {
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(20_000),
        redirect: 'follow'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return new Uint8Array(await res.arrayBuffer())
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Could not download skill file')
}

function safeRelativePath(input: string): string | null {
  const normalized = input.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!normalized) return null
  const segments = normalized.split('/')
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return null
  return segments.join('/')
}

export async function installMarketSkill(
  settings: AppSettings,
  source: string,
  skillId: string
): Promise<MarketInstallResult> {
  if (typeof source !== 'string' || typeof skillId !== 'string' || !source || !skillId) {
    return { ok: false, error: 'invalid' }
  }
  const slug = sanitizeSlug(skillId)
  if (!slug) return { ok: false, error: 'invalid' }

  if (!isGithubSource(source)) {
    const summary = await summaryFor(source, skillId).catch(() => null)
    return { ok: false, error: 'unsupported', command: summary?.command || '' }
  }

  let repo: RepoSnapshot | null
  try {
    repo = await resolveRepo(source)
  } catch {
    return { ok: false, error: 'network' }
  }
  if (!repo) return { ok: false, error: 'not-found' }

  const skillPath = findSkillPath(repo.files, skillId)
  if (!skillPath) return { ok: false, error: 'not-found' }

  const folder = skillPath.replace(/\/SKILL\.md$/i, '')
  let skillFile: Uint8Array
  try {
    skillFile = await fetchRepoFile(source, repo.ref, skillPath)
  } catch {
    return { ok: false, error: 'network' }
  }

  const files: Array<{ path: string; data: Uint8Array }> = [{ path: 'SKILL.md', data: skillFile }]
  if (folder) {
    const prefix = `${folder}/`
    const extras = repo.files
      .filter(
        (file) =>
          file.path.startsWith(prefix) &&
          file.path.toLowerCase() !== skillPath.toLowerCase() &&
          !file.path.includes('/.git/') &&
          file.size <= MAX_FILE_BYTES &&
          file.size > 0
      )
      .slice(0, MAX_EXTRA_FILES)
    let budget = MAX_TOTAL_BYTES
    const chosen: Array<{ file: RepoFile; relative: string }> = []
    for (const file of extras) {
      if (file.size > budget) continue
      const relative = safeRelativePath(file.path.slice(prefix.length))
      if (!relative) continue
      chosen.push({ file, relative })
      budget -= file.size
    }
    const downloaded = await mapLimit(chosen, 4, async (entry) => {
      try {
        const data = await fetchRepoFile(source, repo.ref, entry.file.path)
        return { path: entry.relative, data }
      } catch {
        return null
      }
    })
    for (const entry of downloaded) {
      if (entry) files.push(entry)
    }
  }

  return installSkillFromFiles(settings, slug, files)
}
