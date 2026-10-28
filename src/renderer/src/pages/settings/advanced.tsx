import { useEffect, useState } from 'react'
import { FolderOpen, RotateCcw, SquareTerminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { AppInfo } from '@shared/types'
import { SettingRow, SettingsCard, SettingsSectionLayout } from '@/components/settings/layout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { useSettings } from '@/providers/settings-provider'

export function AdvancedSettings() {
  const { t } = useTranslation()
  const { reset } = useSettings()
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  useEffect(() => {
    let active = true
    void api.app.info().then((next) => {
      if (active) setInfo(next)
    })
    return () => {
      active = false
    }
  }, [])

  const handleReset = async (): Promise<void> => {
    await reset()
    setResetOpen(false)
    toast.success(t('settings.advanced.resetDone'))
  }

  return (
    <SettingsSectionLayout
      title={t('settings.advanced.title')}
      description={t('settings.advanced.desc')}
    >
      <SettingsCard>
        <SettingRow
          label={t('settings.advanced.configFile')}
          description={t('settings.advanced.configDesc')}
          align="start"
          control={
            <Button
              variant="outline"
              size="sm"
              disabled={!info}
              onClick={() => {
                if (info) void api.app.revealPath(info.configPath)
              }}
            >
              <FolderOpen className="size-3.5" />
              {t('settings.advanced.reveal')}
            </Button>
          }
        />
        <div className="py-2">
          <p className="truncate rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground selectable">
            {info?.configPath ?? '—'}
          </p>
        </div>
        <SettingRow
          label={t('settings.advanced.devtools')}
          description={t('settings.advanced.devtoolsDesc')}
          control={
            <Button variant="outline" size="sm" onClick={() => void api.app.openDevTools()}>
              <SquareTerminal className="size-3.5" />
              {t('common.open')}
            </Button>
          }
        />
        <SettingRow
          label={t('settings.advanced.reset')}
          description={t('settings.advanced.resetDesc')}
          control={
            <Button variant="destructive" size="sm" onClick={() => setResetOpen(true)}>
              <RotateCcw className="size-3.5" />
              {t('settings.advanced.reset')}
            </Button>
          }
        />
      </SettingsCard>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t('settings.advanced.resetTitle')}</DialogTitle>
            <DialogDescription>{t('settings.advanced.resetDescLong')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => void handleReset()}>
              {t('settings.advanced.reset')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSectionLayout>
  )
}
