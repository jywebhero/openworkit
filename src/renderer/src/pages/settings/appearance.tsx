import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Language, ThemeMode } from '@shared/types'
import { SettingRow, SettingsCard, SettingsSectionLayout } from '@/components/settings/layout'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useSettings } from '@/providers/settings-provider'

const THEMES: { value: ThemeMode; icon: typeof Sun; labelKey: string }[] = [
  { value: 'system', icon: Monitor, labelKey: 'themeSystem' },
  { value: 'light', icon: Sun, labelKey: 'themeLight' },
  { value: 'dark', icon: Moon, labelKey: 'themeDark' }
]

const LANGUAGES: { value: Language; labelKey: string }[] = [
  { value: 'system', labelKey: 'languageSystem' },
  { value: 'zh', labelKey: 'languageZh' },
  { value: 'en', labelKey: 'languageEn' }
]

export function AppearanceSettings() {
  const { t } = useTranslation()
  const { settings, update } = useSettings()

  return (
    <SettingsSectionLayout
      title={t('settings.appearance.title')}
      description={t('settings.appearance.desc')}
    >
      <SettingsCard
        title={t('settings.appearance.theme')}
        description={t('settings.appearance.themeDesc')}
      >
        <div className="grid grid-cols-3 gap-2.5 pt-3 pb-2">
          {THEMES.map((theme) => {
            const active = settings.theme === theme.value
            const Icon = theme.icon
            return (
              <button
                key={theme.value}
                type="button"
                onClick={() => void update({ theme: theme.value })}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-colors',
                  active
                    ? 'border-foreground/25 bg-accent/50 shadow-xs'
                    : 'border-border hover:bg-accent/30'
                )}
              >
                <ThemePreview mode={theme.value} />
                <span className="flex items-center gap-1.5 px-0.5 text-[12px] font-medium">
                  <Icon className="size-3.5 text-muted-foreground" />
                  {t(`settings.appearance.${theme.labelKey}`)}
                </span>
              </button>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        title={t('settings.appearance.language')}
        description={t('settings.appearance.languageDesc')}
      >
        <div className="flex flex-wrap items-center gap-2 pt-3 pb-2">
          {LANGUAGES.map((language) => {
            const active = settings.language === language.value
            return (
              <button
                key={language.value}
                type="button"
                onClick={() => void update({ language: language.value })}
                className={cn(
                  'h-8 rounded-lg border px-3 text-[12.5px] transition-colors',
                  active
                    ? 'border-foreground/20 bg-accent font-medium text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                {t(`settings.appearance.${language.labelKey}`)}
              </button>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard>
        <SettingRow
          label={t('settings.appearance.compact')}
          description={t('settings.appearance.compactDesc')}
          control={
            <Switch
              checked={settings.compact}
              onCheckedChange={(checked) => void update({ compact: checked })}
            />
          }
        />
      </SettingsCard>
    </SettingsSectionLayout>
  )
}

function ThemePreview({ mode }: { mode: ThemeMode }) {
  if (mode === 'system') {
    return (
      <div className="flex h-[52px] w-full overflow-hidden rounded-lg border border-black/5">
        <MiniPreview dark={false} half />
        <MiniPreview dark half />
      </div>
    )
  }
  return (
    <div className="h-[52px] w-full overflow-hidden rounded-lg border border-black/5">
      <MiniPreview dark={mode === 'dark'} />
    </div>
  )
}

function MiniPreview({ dark, half = false }: { dark: boolean; half?: boolean }) {
  return (
    <div className={cn('flex h-full', half ? 'w-1/2' : 'w-full', dark ? 'bg-[#0b0b0c]' : 'bg-[#fafafa]')}>
      <div className={cn('w-[26%]', dark ? 'bg-[#131316]' : 'bg-[#f0f0f2]')} />
      <div className="flex-1 space-y-1 p-1.5">
        <div className={cn('h-2 rounded-[3px]', dark ? 'bg-[#232327]' : 'bg-white shadow-xs')} />
        <div
          className={cn('h-2 w-3/4 rounded-[3px]', dark ? 'bg-[#1b1b1f]' : 'bg-white/85')}
        />
      </div>
    </div>
  )
}
