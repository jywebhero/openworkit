import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Tint {
  bg: string
  fg: string
}

export function IconTile({
  icon: Icon,
  tint,
  size = 'md',
  className
}: {
  icon: LucideIcon
  tint: Tint
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <div
      className={cn(
        'icon-tile flex shrink-0 items-center justify-center rounded-[14px]',
        size === 'sm' ? 'size-9 rounded-[11px]' : size === 'lg' ? 'size-14' : 'size-[46px]',
        className
      )}
      style={{ '--tile-bg': tint.bg, '--tile-fg': tint.fg } as CSSProperties}
    >
      <Icon
        className={size === 'sm' ? 'size-[17px]' : size === 'lg' ? 'size-[26px]' : 'size-[21px]'}
        strokeWidth={1.8}
      />
    </div>
  )
}
