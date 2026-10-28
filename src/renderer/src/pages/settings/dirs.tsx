import { FolderCog, FolderOpen, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { SkillDirConfig } from '@shared/types'
import { AgentLogo } from '@/components/app/agent-logo'
import { SettingsCard, SettingsSectionLayout } from '@/components/settings/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { describeSkillDir } from '@/lib/agents'
import { api } from '@/lib/api'
import { useSettings } from '@/providers/settings-provider'
import { useSkills } from '@/providers/skills-provider'

export function DirsSettings() {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const { data } = useSkills()

  const toggleDir = async (dir: SkillDirConfig, enabled: boolean): Promise<void> => {
    await update({
      skillDirs: settings.skillDirs.map((entry) =>
        entry.id === dir.id ? { ...entry, enabled } : entry
      )
    })
  }

  const addDir = async (): Promise<void> => {
    const picked = await api.skills.pickDirectory()
    if (!picked) return
    const normalized = picked.replace(/\/+$/, '')
    if (settings.skillDirs.some((dir) => dir.path.replace(/\/+$/, '') === normalized)) {
      toast.error(t('settings.dirs.duplicate'))
      return
    }
    const label = picked.split('/').filter(Boolean).pop() ?? picked
    const entry: SkillDirConfig = {
      id: `custom-${Date.now()}`,
      label,
      path: picked,
      enabled: true,
      scope: 'user'
    }
    await update({ skillDirs: [...settings.skillDirs, entry] })
    toast.success(t('settings.dirs.added'))
  }

  const removeDir = async (dir: SkillDirConfig): Promise<void> => {
    if (settings.skillDirs.length <= 1) {
      toast.error(t('settings.dirs.cannotRemoveLast'))
      return
    }
    const skillDirs = settings.skillDirs.filter((entry) => entry.id !== dir.id)
    const installDirId =
      settings.installDirId === dir.id ? skillDirs[0].id : settings.installDirId
    await update({ skillDirs, installDirId })
    toast.success(t('settings.dirs.removed'))
  }

  return (
    <SettingsSectionLayout
      title={t('settings.dirs.title')}
      description={t('settings.dirs.desc')}
      action={
        <Button size="sm" onClick={() => void addDir()}>
          <Plus className="size-3.5" />
          {t('settings.dirs.add')}
        </Button>
      }
    >
      <SettingsCard>
        {settings.skillDirs.map((dir) => {
          const status = data?.dirs.find((entry) => entry.id === dir.id)
          const agent = describeSkillDir(dir)
          return (
            <div key={dir.id} className="flex items-start gap-3 py-[var(--row-pad)] first:pt-2 last:pb-1">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-muted text-muted-foreground">
                {agent.logo ? (
                  <AgentLogo logo={agent.logo} className="size-[18px]" />
                ) : (
                  <FolderCog className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="max-w-[300px] truncate text-[13px] font-medium">{dir.label}</span>
                  <Badge variant="outline">
                    {dir.scope === 'project' ? t('installed.projectScope') : t('installed.userScope')}
                  </Badge>
                  {dir.id === settings.installDirId && (
                    <Badge variant="secondary">{t('settings.dirs.installTarget')}</Badge>
                  )}
                  {status && !status.exists && (
                    <Badge variant="muted">{t('settings.dirs.missing')}</Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {t('settings.dirs.count', { count: status?.count ?? 0 })}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground" title={dir.path}>
                  {dir.path}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Switch
                  checked={dir.enabled}
                  onCheckedChange={(checked) => void toggleDir(dir, checked)}
                  aria-label={t('settings.dirs.enable')}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-sm" className="text-muted-foreground" />}
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuItem onClick={() => void api.app.openPath(dir.path)}>
                      <FolderOpen />
                      {t('common.open')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void api.app.revealPath(dir.path)}>
                      <FolderCog />
                      {t('common.reveal')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive [&_svg]:text-destructive"
                      onClick={() => void removeDir(dir)}
                    >
                      <Trash2 />
                      {t('settings.dirs.remove')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </SettingsCard>
    </SettingsSectionLayout>
  )
}
