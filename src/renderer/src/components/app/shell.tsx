import { Toaster } from '@/components/ui/sonner'
import { useGlobalHotkeys } from '@/hooks/use-global-hotkeys'
import { useRoute } from '@/lib/router'
import { useSettings } from '@/providers/settings-provider'
import { ConnectorsPage } from '@/pages/connectors-page'
import { InstalledPage } from '@/pages/installed-page'
import { MarketPage } from '@/pages/market-page'
import { SettingsPage } from '@/pages/settings-page'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'

export function Shell() {
  const route = useRoute()
  const { isDark } = useSettings()
  useGlobalHotkeys()

  return (
    <div className="flex h-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar route={route} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {route.page === 'market' && <MarketPage />}
          {route.page === 'installed' && <InstalledPage />}
          {route.page === 'connectors' && <ConnectorsPage />}
          {route.page === 'settings' && <SettingsPage section={route.section} />}
        </main>
      </div>
      <Toaster theme={isDark ? 'dark' : 'light'} />
    </div>
  )
}
