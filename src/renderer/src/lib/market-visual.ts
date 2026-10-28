import {
  Blocks,
  Bot,
  Braces,
  FileText,
  Globe2,
  LayoutGrid,
  Palette,
  Sparkles,
  SquareTerminal,
  Wand2,
  type LucideIcon
} from 'lucide-react'
import type { Tint } from '@/components/app/icon-tile'

const PALETTE: Array<{ icon: LucideIcon; tint: Tint }> = [
  { icon: Sparkles, tint: { bg: '#eaf2ff', fg: '#2563eb' } },
  { icon: Wand2, tint: { bg: '#eeedfe', fg: '#6d28d9' } },
  { icon: SquareTerminal, tint: { bg: '#e8f6ec', fg: '#16a34a' } },
  { icon: Blocks, tint: { bg: '#fff3e0', fg: '#c2410c' } },
  { icon: Palette, tint: { bg: '#fdebf3', fg: '#db2777' } },
  { icon: FileText, tint: { bg: '#e3f6f3', fg: '#0f766e' } },
  { icon: Bot, tint: { bg: '#e4f5fa', fg: '#0e7490' } },
  { icon: Braces, tint: { bg: '#e8eeff', fg: '#3730a3' } },
  { icon: Globe2, tint: { bg: '#fdecec', fg: '#dc2626' } },
  { icon: LayoutGrid, tint: { bg: '#eef6e4', fg: '#4d7c0f' } }
]

function hash(value: string): number {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0
  }
  return result
}

export function marketVisual(key: string): { icon: LucideIcon; tint: Tint } {
  return PALETTE[hash(key) % PALETTE.length]
}
