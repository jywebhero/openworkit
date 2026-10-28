import { useTranslation } from 'react-i18next'
import { SettingRow, SettingsCard, SettingsSectionLayout } from '@/components/settings/layout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '@/providers/settings-provider'

export function PreferencesSettings() {
  const { t } = useTranslation()
  const { settings, update } = useSettings()

  return (
    <SettingsSectionLayout
      title={t('settings.preferences.title')}
      description={t('settings.preferences.desc')}
    >
      <SettingsCard>
        <SettingRow
          label={t('settings.preferences.installTarget')}
          description={t('settings.preferences.installTargetDesc')}
          align="start"
          control={
            <Select
              value={settings.installDirId}
              onValueChange={(value) => void update({ installDirId: String(value ?? '') })}
              items={settings.skillDirs.map((dir) => ({ value: dir.id, label: dir.label }))}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settings.skillDirs.map((dir) => (
                  <SelectItem key={dir.id} value={dir.id}>
                    {dir.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <SettingRow
          label={t('settings.preferences.confirmDelete')}
          description={t('settings.preferences.confirmDeleteDesc')}
          control={
            <Switch
              checked={settings.confirmDelete}
              onCheckedChange={(checked) => void update({ confirmDelete: checked })}
            />
          }
        />
        <SettingRow
          label={t('settings.preferences.autoScan')}
          description={t('settings.preferences.autoScanDesc')}
          control={
            <Switch
              checked={settings.autoScan}
              onCheckedChange={(checked) => void update({ autoScan: checked })}
            />
          }
        />
      </SettingsCard>
    </SettingsSectionLayout>
  )
}
