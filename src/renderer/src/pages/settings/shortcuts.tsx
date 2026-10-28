import { useTranslation } from 'react-i18next'
import { SettingRow, SettingsCard, SettingsSectionLayout } from '@/components/settings/layout'

const SHORTCUTS: { key: string; keys: string[] }[] = [
  { key: 'focusSearch', keys: ['⌘', 'K'] },
  { key: 'navMarket', keys: ['⌘', '1'] },
  { key: 'navInstalled', keys: ['⌘', '2'] },
  { key: 'navConnectors', keys: ['⌘', '3'] },
  { key: 'openSettings', keys: ['⌘', ','] },
  { key: 'rescan', keys: ['⌘', 'R'] },
  { key: 'closeDialog', keys: ['Esc'] }
]

export function ShortcutsSettings() {
  const { t } = useTranslation()

  return (
    <SettingsSectionLayout
      title={t('settings.shortcuts.title')}
      description={t('settings.shortcuts.desc')}
    >
      <SettingsCard>
        {SHORTCUTS.map((shortcut) => (
          <SettingRow
            key={shortcut.key}
            label={t(`settings.shortcuts.${shortcut.key}`)}
            control={
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted/60 px-1.5 font-sans text-[11px] font-medium text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            }
          />
        ))}
      </SettingsCard>
    </SettingsSectionLayout>
  )
}
