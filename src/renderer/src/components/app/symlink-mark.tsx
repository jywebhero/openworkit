import { Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function SymlinkMark({ target, className }: { target?: string; className?: string }) {
  const { t } = useTranslation()
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="img"
            aria-label={t('installed.symlink')}
            className={cn(
              'absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm',
              className
            )}
          />
        }
      >
        <Link2 className="size-3" />
      </TooltipTrigger>
      {target && <TooltipContent className="max-w-[360px] break-all">{target}</TooltipContent>}
    </Tooltip>
  )
}
