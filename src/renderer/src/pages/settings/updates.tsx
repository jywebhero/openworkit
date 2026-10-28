import { useState } from 'react'
import { LoaderCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { SettingsCard, SettingsSectionLayout } from '@/components/settings/layout'
import { Button } from '@/components/ui/button'
import { useAppInfo } from '@/hooks/use-app-info'
import { cn } from '@/lib/utils'
import { useSettings } from '@/providers/settings-provider'

const CHANNELS = [
  { value: 'stable' as const, labelKey: 'stable' },
  { value: 'beta' as const, labelKey: 'beta' }
]

export function UpdatesSettings() {
  const { t } = useTranslation()
  const info = useAppInfo()
  const { settings, update } = useSettings()
  const [checking, setChecking] = useState(false)

  const check = (): void => {
    setChecking(true)
    window.setTimeout(() => {
      setChecking(false)
      toast.success(t('settings.updates.upToDate'))
    }, 700)
  }

  return (
    <SettingsSectionLayout
      title={t('settings.updates.title')}
      description={t('settings.updates.desc')}
    >
      <SettingsCard>
        <div className="flex items-center justify-between gap-6 py-2">
          <div>
            <div className="text-[13px] font-medium">{t('settings.updates.current')}</div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {t('app.name')} v{info?.version ?? '0.1.0'} · Electron {info?.electron ?? '—'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={check} disabled={checking}>
            {checking ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {checking ? t('settings.updates.checking') : t('settings.updates.check')}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title={t('settings.updates.channel')}>
        <div className="flex items-center gap-2 py-3">
          {CHANNELS.map((channel) => (
            <button
              key={channel.value}
              type="button"
              onClick={() => void update({ updateChannel: channel.value })}
              className={cn(
                'h-8 rounded-lg border px-3 text-[12.5px] transition-colors',
                settings.updateChannel === channel.value
                  ? 'border-foreground/20 bg-accent font-medium text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              {t(`settings.updates.${channel.labelKey}`)}
            </button>
          ))}
        </div>
        <p className="pb-2 text-[11.5px] leading-relaxed text-muted-foreground">
          {t('settings.updates.note')}
        </p>
      </SettingsCard>
    </SettingsSectionLayout>
  )
}
