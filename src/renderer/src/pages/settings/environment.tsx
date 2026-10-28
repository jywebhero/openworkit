import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AppInfo, EnvEntry } from '@shared/types'
import { SettingRow, SettingsCard, SettingsSectionLayout } from '@/components/settings/layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export function EnvironmentSettings() {
  const { t } = useTranslation()
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [env, setEnv] = useState<EnvEntry[]>([])

  useEffect(() => {
    let active = true
    void Promise.all([api.app.info(), api.app.env()]).then(([nextInfo, nextEnv]) => {
      if (!active) return
      setInfo(nextInfo)
      setEnv(nextEnv)
    })
    return () => {
      active = false
    }
  }, [])

  const rows: { label: string; value: string }[] = info
    ? [
        { label: t('app.name'), value: info.version },
        { label: 'Electron', value: info.electron },
        { label: 'Chromium', value: info.chrome },
        { label: 'Node', value: info.node },
        { label: t('settings.environment.versions'), value: `${info.platform} · ${info.arch}` }
      ]
    : []

  const paths: { label: string; value: string }[] = info
    ? [
        { label: t('settings.environment.appPath'), value: info.appPath },
        { label: t('settings.environment.userData'), value: info.userData },
        { label: t('settings.environment.configPath'), value: info.configPath },
        { label: t('settings.environment.logsPath'), value: info.logsPath },
        { label: t('settings.environment.installDir'), value: info.installDir }
      ]
    : []

  const copy = async (value: string): Promise<void> => {
    await api.app.copyText(value)
  }

  return (
    <SettingsSectionLayout
      title={t('settings.environment.title')}
      description={t('settings.environment.desc')}
    >
      <SettingsCard title={t('settings.environment.versions')}>
        {rows.map((row) => (
          <SettingRow
            key={row.label}
            label={row.label}
            control={
              <span className="font-mono text-[11.5px] text-muted-foreground">{row.value}</span>
            }
          />
        ))}
      </SettingsCard>

      <SettingsCard title={t('settings.environment.paths')}>
        {paths.map((row) => (
          <SettingRow
            key={row.label}
            label={row.label}
            align="start"
            control={
              <span className="flex items-center gap-2">
                <span
                  className="block max-w-[360px] truncate font-mono text-[11px] text-muted-foreground selectable"
                  title={row.value}
                >
                  {row.value}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  onClick={() => void copy(row.value)}
                >
                  <Copy className="size-3.5" />
                </Button>
              </span>
            }
          />
        ))}
      </SettingsCard>

      <SettingsCard title={t('settings.environment.env')}>
        {env.length === 0 ? (
          <p className="py-3 text-[12px] text-muted-foreground">{t('settings.environment.empty')}</p>
        ) : (
          env.map((entry) => (
            <SettingRow
              key={entry.key}
              label={entry.key}
              align="start"
              control={
                <span className="flex max-w-[380px] items-center gap-2">
                  <span
                    className="block truncate font-mono text-[11px] text-muted-foreground selectable"
                    title={entry.value}
                  >
                    {entry.value}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => void copy(entry.value)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </span>
              }
            />
          ))
        )}
      </SettingsCard>
    </SettingsSectionLayout>
  )
}
