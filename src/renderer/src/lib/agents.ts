import claudeLogo from '@/assets/agents/claude-color.svg?raw'
import codexLogo from '@/assets/agents/codex-color.svg?raw'
import cursorLogo from '@/assets/agents/cursor.svg?raw'
import doubaoLogo from '@/assets/agents/doubao-color.svg?raw'
import geminiLogo from '@/assets/agents/geminicli-color.svg?raw'
import kimiLogo from '@/assets/agents/kimi-color.svg?raw'
import opencodeLogo from '@/assets/agents/opencode.svg?raw'
import piLogo from '@/assets/agents/pi.svg?raw'
import qoderLogo from '@/assets/agents/qoder-color.svg?raw'
import qwenLogo from '@/assets/agents/qwen-color.svg?raw'
import traeLogo from '@/assets/agents/trae-color.svg?raw'
import workbuddyLogo from '@/assets/agents/workbuddy-color.svg?raw'
import zaiLogo from '@/assets/agents/zai.svg?raw'

// Brand marks from LobeHub Icons (MIT): https://lobehub.com/icons
// Order matters: more specific paths must be matched before their generic parents.
const KNOWN_AGENTS = [
  { key: 'qwenworkcn', pattern: /(^|\/)\.qwenworkcn(\/|$)/i, label: 'QwenWork CN', logo: qwenLogo },
  { key: 'qwenwork', pattern: /(^|\/)\.qwenwork(\/|$)/i, label: 'QwenWork', logo: qwenLogo },
  { key: 'kimi-code', pattern: /(^|\/)\.kimi-code(\/|$)/i, label: 'Kimi Code', logo: kimiLogo },
  { key: 'kimi-work', pattern: /(^|\/)\.kimi-work(\/|$)/i, label: 'Kimi Work', logo: kimiLogo },
  { key: 'trae-work', pattern: /(^|\/)\.trae-work(\/|$)/i, label: 'TRAE Work', logo: traeLogo },
  { key: 'trae-work-cn', pattern: /(^|\/)\.trae-cn(\/|$)/i, label: 'TRAE Work', logo: traeLogo },
  { key: 'trae', pattern: /(^|\/)\.trae(\/|$)/i, label: 'TRAE', logo: traeLogo },
  { key: 'codex', pattern: /(^|\/)\.codex(\/|$)/i, label: 'Codex', logo: codexLogo },
  { key: 'gemini', pattern: /(^|\/)\.gemini(\/|$)/i, label: 'Gemini CLI', logo: geminiLogo },
  {
    key: 'opencode',
    pattern: /(^|\/)(?:\.config\/opencode|\.opencode)(\/|$)/i,
    label: 'OpenCode',
    logo: opencodeLogo
  },
  { key: 'pi', pattern: /(^|\/)\.pi(\/|$)/i, label: 'Pi', logo: piLogo },
  { key: 'workbuddy', pattern: /(^|\/)\.workbuddy(\/|$)/i, label: 'WorkBuddy', logo: workbuddyLogo },
  { key: 'doubao', pattern: /(^|\/)doubao(\/|$)/i, label: 'Doubao', logo: doubaoLogo },
  { key: 'zcode', pattern: /(^|\/)\.zcode(\/|$)/i, label: 'ZCode', logo: zaiLogo },
  { key: 'claude', pattern: /(^|\/)\.claude(\/|$)/i, label: 'Claude', logo: claudeLogo },
  { key: 'cursor', pattern: /(^|\/)\.cursor(\/|$)/i, label: 'Cursor', logo: cursorLogo },
  { key: 'qoder', pattern: /(^|\/)\.qoder(?:-cn)?(\/|$)/i, label: 'Qoder', logo: qoderLogo },
  { key: 'agents', pattern: /(^|\/)\.agents(\/|$)/i, label: 'Agents', logo: null }
] as const

export interface SkillDirAgent {
  key: string
  label: string
  logo: string | null
}

function shortLabel(dirPath: string): string {
  const parts = dirPath.split('/').filter(Boolean)
  const last = parts.at(-1) === 'skills' ? parts.at(-2) : parts.at(-1)
  return last ?? dirPath
}

export function describeSkillDir(dir: { id: string; path: string }): SkillDirAgent {
  const target = dir.path.replace(/\\/g, '/')
  for (const agent of KNOWN_AGENTS) {
    if (agent.pattern.test(target)) {
      return { key: agent.key, label: agent.label, logo: agent.logo }
    }
  }
  return { key: `custom:${dir.id}`, label: shortLabel(target), logo: null }
}

export function agentMark(key: string | null): SkillDirAgent | null {
  if (!key) return null
  const agent = KNOWN_AGENTS.find((entry) => entry.key === key)
  return agent ? { key: agent.key, label: agent.label, logo: agent.logo } : null
}
