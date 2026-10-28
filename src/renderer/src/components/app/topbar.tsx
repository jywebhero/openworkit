import { Bell, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { focusSearch } from '@/hooks/use-global-hotkeys'
import { navigate, type Route } from '@/lib/router'

const SETTINGS_SECTIONS = [
  'appearance',
  'preferences',
  'dirs',
  'advanced',
  'shortcuts',
  'environment',
  'updates'
]

export function TopBar({ route }: { route: Route }) {
  const { t } = useTranslation()

  const pageLabel =
    route.page === 'settings'
      ? route.section && SETTINGS_SECTIONS.includes(route.section)
        ? t(`settings.${route.section}.title`)
        : t('nav.settings')
      : t(`nav.${route.page}`)

  return (
    <header className="app-drag flex h-[52px] shrink-0 items-center gap-2 px-6">
      <div className="flex min-w-0 items-center gap-2 text-[12.5px]">
        <span className="truncate font-medium text-foreground">{pageLabel}</span>
        <span className="truncate text-muted-foreground">{t('app.name')}</span>
      </div>

      <div className="app-no-drag ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={focusSearch}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Search className="size-[15px]" />
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate('settings/updates')}
              />
            }
          >
            <Bell className="size-[17px]" />
          </TooltipTrigger>
          <TooltipContent>{t('settings.updates.title')}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
