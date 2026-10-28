import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type {
  ConnectorFile,
  ConnectorScanResult,
  ConnectorServer,
  ConnectorTransport,
  Scope
} from '../shared/types'

type Candidate = { path: string; scope: Scope; agent: string | null; kind?: 'toml' }

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function candidateFiles(): Candidate[] {
  const home = os.homedir()
  const appSupport = path.join(home, 'Library', 'Application Support')
  return [
    { path: path.join(home, '.claude.json'), scope: 'user', agent: 'claude' },
    { path: path.join(home, '.claude', 'settings.json'), scope: 'user', agent: 'claude' },
    { path: path.join(home, '.qoder', 'mcp.json'), scope: 'user', agent: 'qoder' },
    { path: path.join(home, '.qoder', 'settings.json'), scope: 'user', agent: 'qoder' },
    { path: path.join(home, '.qoder-cn', 'mcp.json'), scope: 'user', agent: 'qoder' },
    { path: path.join(home, '.qoder-cn', 'settings.json'), scope: 'user', agent: 'qoder' },
    { path: path.join(home, '.cursor', 'mcp.json'), scope: 'user', agent: 'cursor' },
    { path: path.join(appSupport, 'Claude', 'claude_desktop_config.json'), scope: 'user', agent: 'claude' },
    { path: path.join(home, '.workbuddy', 'connectors', 'default', 'mcp.json'), scope: 'user', agent: 'workbuddy' },
    { path: path.join(home, '.config', 'opencode', 'opencode.json'), scope: 'user', agent: 'opencode' },
    { path: path.join(home, '.pi', 'agent', 'mcp.json'), scope: 'user', agent: 'pi' },
    { path: path.join(home, '.codex', 'config.toml'), scope: 'user', agent: 'codex', kind: 'toml' },
    { path: path.join(appSupport, 'Trae', 'User', 'mcp.json'), scope: 'user', agent: 'trae' },
    { path: path.join(appSupport, 'Trae CN', 'User', 'mcp.json'), scope: 'user', agent: 'trae-work-cn' },
    { path: path.join(appSupport, 'Trae Work', 'User', 'mcp.json'), scope: 'user', agent: 'trae-work' },
    { path: path.join(process.cwd(), '.mcp.json'), scope: 'project', agent: null },
    { path: path.join(process.cwd(), '.trae', 'mcp.json'), scope: 'project', agent: 'trae' },
    { path: path.join(process.cwd(), '.pi', 'mcp.json'), scope: 'project', agent: 'pi' },
    { path: path.join(process.cwd(), 'opencode.json'), scope: 'project', agent: 'opencode' }
  ]
}

function commandString(entry: Record<string, unknown>): string {
  const command = entry.command
  const args = asStringArray(entry.args)
  if (typeof command === 'string') return [command, ...args].join(' ').trim()
  if (Array.isArray(command)) return [...asStringArray(command), ...args].join(' ').trim()
  return args.join(' ').trim()
}

function toServer(
  name: string,
  raw: unknown,
  source: string,
  scope: Scope,
  agent: string | null
): ConnectorServer | null {
  const entry = asRecord(raw)
  if (entry.disabled === true || entry.enabled === false) return null
  const command = commandString(entry)
  const url = asString(entry.url)
  if (!command && !url) return null

  const declared = (asString(entry.type) || asString(entry.transport)).toLowerCase()
  let transport: ConnectorTransport = command ? 'stdio' : 'unknown'
  if (url) transport = declared === 'sse' ? 'sse' : 'http'

  return {
    id: `${source}#${name}`,
    name,
    transport,
    command: command || undefined,
    url: url || undefined,
    source,
    scope,
    agent
  }
}

function collectServers(
  data: unknown,
  source: string,
  scope: Scope,
  agent: string | null
): ConnectorServer[] {
  const root = asRecord(data)
  const servers: ConnectorServer[] = []

  for (const [name, value] of Object.entries(asRecord(root.mcpServers))) {
    const server = toServer(name, value, source, scope, agent)
    if (server) servers.push(server)
  }

  // OpenCode stores MCP servers under `mcp`, with array commands for local servers.
  for (const [name, value] of Object.entries(asRecord(root.mcp))) {
    const server = toServer(name, value, source, scope, agent)
    if (server) servers.push(server)
  }

  for (const project of Object.values(asRecord(root.projects))) {
    for (const [name, value] of Object.entries(asRecord(asRecord(project).mcpServers))) {
      const server = toServer(name, value, source, 'project', agent)
      if (server) servers.push(server)
    }
  }

  return servers
}

function stripTomlComment(line: string): string {
  let quote = ''
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (quote) {
      if (char === '\\' && quote === '"') i += 1
      else if (char === quote) quote = ''
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '#') {
      return line.slice(0, i)
    }
  }
  return line
}

function isBalanced(value: string): boolean {
  let depth = 0
  let quote = ''
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if (quote) {
      if (char === '\\' && quote === '"') i += 1
      else if (char === quote) quote = ''
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '[' || char === '{') {
      depth += 1
    } else if (char === ']' || char === '}') {
      depth -= 1
    }
  }
  return depth <= 0 && !quote
}

function splitTomlList(body: string): string[] {
  const parts: string[] = []
  let current = ''
  let quote = ''
  let depth = 0
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i]
    if (quote) {
      current += char
      if (char === '\\' && quote === '"') {
        current += body[i + 1] ?? ''
        i += 1
      } else if (char === quote) {
        quote = ''
      }
    } else if (char === '"' || char === "'") {
      quote = char
      current += char
    } else if (char === '[' || char === '{') {
      depth += 1
      current += char
    } else if (char === ']' || char === '}') {
      depth -= 1
      current += char
    } else if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts.map((part) => part.trim()).filter(Boolean)
}

function parseTomlValue(raw: string): unknown {
  const value = raw.trim()
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value)
    } catch {
      return value.slice(1, -1)
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1)
  if (value === 'true' || value === 'false') return value === 'true'
  if (value.startsWith('[') && value.endsWith(']')) {
    return splitTomlList(value.slice(1, -1)).map(parseTomlValue)
  }
  if (value.startsWith('{') && value.endsWith('}')) {
    const table: Record<string, unknown> = {}
    for (const pair of splitTomlList(value.slice(1, -1))) {
      const eq = pair.indexOf('=')
      if (eq === -1) continue
      const key = pair.slice(0, eq).trim().replace(/^["']|["']$/g, '')
      table[key] = parseTomlValue(pair.slice(eq + 1))
    }
    return table
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  return undefined
}

function parseTomlServers(text: string): Record<string, unknown> {
  const servers: Record<string, Record<string, unknown>> = {}
  const lines = text.split(/\r?\n/)
  let current: Record<string, unknown> | null = null

  for (let i = 0; i < lines.length; i += 1) {
    const line = stripTomlComment(lines[i]).trim()
    if (!line) continue

    const table = /^\[mcp_servers\.(?:"([^"]+)"|([A-Za-z0-9_-]+))\]$/.exec(line)
    if (table) {
      const name = table[1] ?? table[2]
      current = servers[name] = {}
      continue
    }
    if (line.startsWith('[')) {
      current = null
      continue
    }
    if (!current) continue

    const pair = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line)
    if (!pair) continue
    let raw = pair[2]
    while (!isBalanced(raw) && i + 1 < lines.length) {
      i += 1
      raw += ` ${stripTomlComment(lines[i]).trim()}`
    }
    const value = parseTomlValue(raw)
    if (value !== undefined) current[pair[1]] = value
  }

  return servers
}

export async function scanConnectors(): Promise<ConnectorScanResult> {
  const files: ConnectorFile[] = []
  const servers: ConnectorServer[] = []
  const seen = new Set<string>()

  for (const candidate of candidateFiles()) {
    let raw: string
    try {
      raw = await fs.readFile(candidate.path, 'utf8')
    } catch {
      continue
    }

    let parsed: unknown
    if (candidate.kind === 'toml') {
      parsed = { mcpServers: parseTomlServers(raw) }
    } else {
      try {
        parsed = JSON.parse(raw)
      } catch {
        continue
      }
    }

    const found = collectServers(parsed, candidate.path, candidate.scope, candidate.agent)
    files.push({ path: candidate.path, count: found.length, agent: candidate.agent })
    for (const server of found) {
      if (seen.has(server.id)) continue
      seen.add(server.id)
      servers.push(server)
    }
  }

  servers.sort((a, b) => a.name.localeCompare(b.name))
  return { files, servers }
}
