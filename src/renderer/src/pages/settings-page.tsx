import { AdvancedSettings } from './settings/advanced'
import { AppearanceSettings } from './settings/appearance'
import { DirsSettings } from './settings/dirs'
import { EnvironmentSettings } from './settings/environment'
import { OverviewSettings } from './settings/overview'
import { PreferencesSettings } from './settings/preferences'
import { ShortcutsSettings } from './settings/shortcuts'
import { UpdatesSettings } from './settings/updates'

export function SettingsPage({ section }: { section?: string }) {
  switch (section) {
    case 'preferences':
      return <PreferencesSettings />
    case 'dirs':
      return <DirsSettings />
    case 'advanced':
      return <AdvancedSettings />
    case 'appearance':
      return <AppearanceSettings />
    case 'shortcuts':
      return <ShortcutsSettings />
    case 'environment':
      return <EnvironmentSettings />
    case 'updates':
      return <UpdatesSettings />
    default:
      return <OverviewSettings />
  }
}
