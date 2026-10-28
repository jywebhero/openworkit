import type { ReactNode } from 'react'
import { ChevronDown, Package, Plug, Settings as SettingsIcon, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAppInfo } from '@/hooks/use-app-info'
import { navigate, type PageId, useRoute } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useSkills } from '@/providers/skills-provider'
import logoMark from '@/components/logo.svg'

const PRIMARY_NAV = [
  { page: 'market' as PageId, icon: Store, key: 'nav.market' },
  { page: 'installed' as PageId, icon: Package, key: 'nav.installed' },
  { page: 'connectors' as PageId, icon: Plug, key: 'nav.connectors' }
]

export function Sidebar() {
  const { t } = useTranslation()
  const route = useRoute()
  const { skills } = useSkills()
  const info = useAppInfo()

  const isActive = (page: PageId): boolean => route.page === page

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="app-drag h-[52px] shrink-0" />

      <div className="app-drag flex items-center gap-2 px-3.5 pb-3">
        <img
          src={logoMark}
          alt=""
          className="size-7 shrink-0 rounded-[9px] shadow-sm ring-1 ring-black/5 dark:ring-white/15"
        />
        <span className="text-[13.5px] font-semibold tracking-[-0.01em]">{t('app.name')}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="app-no-drag ml-auto text-sidebar-foreground hover:bg-sidebar-accent"
              />
            }
          >
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>{t('app.tagline')}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate('market')}>
              <Store />
              {t('nav.market')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('installed')}>
              <Package />
              {t('nav.installed')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('settings')}>
              <SettingsIcon />
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('settings/updates')}>
              {t('common.checkUpdates')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.close()}>{t('common.quit')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex flex-col gap-0.5 px-2.5">
        {PRIMARY_NAV.map((item) => (
          <NavItem
            key={item.page}
            active={isActive(item.page)}
            icon={<item.icon className="size-4" />}
            label={t(item.key)}
            onClick={() => navigate(item.page)}
          />
        ))}

        <div className="px-3 pt-6 pb-1.5 text-[10.5px] font-medium tracking-[0.12em] text-sidebar-foreground/60 uppercase">
          {t('nav.global')}
        </div>
        <NavItem
          active={isActive('settings')}
          icon={<SettingsIcon className="size-4" />}
          label={t('nav.settings')}
          onClick={() => navigate('settings')}
        />
      </nav>

      <div className="mt-auto flex items-center justify-between px-4 pb-4 text-[11px] text-sidebar-foreground/70">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-success" />
          {t('nav.local')} · {skills.length} {t('common.skills')}
        </span>
        <span className="tabular-nums">v{info?.version ?? '0.1.0'}</span>
      </div>
    </aside>
  )
}

function NavItem({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[34px] w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13px] transition-colors',
        active
          ? 'bg-sidebar-accent font-medium text-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
      )}
    >
      <span className={cn('text-sidebar-foreground', active && 'text-foreground')}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}
