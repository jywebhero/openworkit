import { Shell } from '@/components/app/shell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SettingsProvider } from '@/providers/settings-provider'
import { SkillsProvider } from '@/providers/skills-provider'

export default function App() {
  return (
    <SettingsProvider>
      <SkillsProvider>
        <TooltipProvider delay={300} timeout={200}>
          <Shell />
        </TooltipProvider>
      </SkillsProvider>
    </SettingsProvider>
  )
}
