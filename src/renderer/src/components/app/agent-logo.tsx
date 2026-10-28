import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AgentLogo({ logo, className }: { logo: string | null; className?: string }) {
  if (!logo) {
    return (
      <Sparkles
        aria-hidden
        className={cn('size-4 shrink-0 text-muted-foreground', className)}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn('inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-full', className)}
      dangerouslySetInnerHTML={{ __html: logo }}
    />
  )
}
