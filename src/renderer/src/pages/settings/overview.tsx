import type { LucideIcon } from 'lucide-react'
import {
  ChevronRight,
  ClipboardCopy,
  FolderCog,
  FolderOpen,
  Keyboard,
  Palette,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Wrench
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageContainer, PageTitle, SectionLabel } from '@/components/app/page'
import { Button } from '@/components/ui/button'
import { useAppInfo } from '@/hooks/use-app-info'
import { api } from '@/lib/api'
import { navigate } from '@/lib/router'

interface CardSpec {
  section: string
  icon: LucideIcon
  titleKey: string
  descKey: string
}

const WORKSPACE: CardSpec[] = [
  {
    section: 'preferences',
    icon: SlidersHorizontal,
    titleKey: 'preferences',
    descKey: 'preferences'
  },
  { section: 'dirs', icon: FolderCog, titleKey: 'skillDirs', descKey: 'skillDirs' },
  { section: 'advanced', icon: Wrench, titleKey: 'advanced', descKey: 'advanced' }
]

const GLOBAL: CardSpec[] = [
  { section: 'appearance', icon: Palette, titleKey: 'appearance', descKey: 'appearance' },
  { section: 'shortcuts', icon: Keyboard, titleKey: 'shortcuts', descKey: 'shortcuts' },
  { section: 'environment', icon: Terminal, titleKey: 'environment', descKey: 'environment' },
  { section: 'updates', icon: RefreshCw, titleKey: 'updates', descKey: 'updates' }
]

export function OverviewSettings() {
  const { t } = useTranslation()
  const info = useAppInfo()

  const copyDiagnostics = async (): Promise<void> => {
    try {
      const [appInfo, settings, scan] = await Promise.all([
        api.app.info(),
        api.settings.get(),
        api.skills.scan()
      ])
      const payload = {
        generatedAt: new Date().toISOString(),
        app: appInfo,
        settings,
        skills: scan.skills.map((skill) => ({
          name: skill.meta.name,
          slug: skill.slug,
          enabled: skill.enabled,
          dir: skill.dirPath
        }))
      }
      await api.app.copyText(JSON.stringify(payload, null, 2))
      toast.success(t('settings.help.copied'))
    } catch {
      toast.error(t('toasts.error'))
    }
  }

  return (
    <PageContainer>
      <PageTitle title={t('settings.title')} description={t('settings.subtitle')} />

      <section>
        <SectionLabel className="mb-2.5">{t('settings.sections.workspace')}</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {WORKSPACE.map((card) => (
            <SettingsTile key={card.section} card={card} />
          ))}
        </div>
      </section>

      <section className="mt-7">
        <SectionLabel className="mb-2.5">{t('settings.sections.global')}</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {GLOBAL.map((card) => (
            <SettingsTile key={card.section} card={card} />
          ))}
        </div>
      </section>

      <section className="mt-7">
        <SectionLabel className="mb-2.5">{t('settings.sections.help')}</SectionLabel>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-muted text-foreground/70">
              <Sparkles className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold">{t('settings.help.title')}</h2>
              <p className="mt-1 max-w-[640px] text-[12.5px] leading-relaxed text-muted-foreground">
                {t('settings.help.desc')}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void copyDiagnostics()}>
              <ClipboardCopy className="size-3.5" />
              {t('settings.help.diagnostics')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!info}
              onClick={() => {
                if (info) void api.app.openPath(info.logsPath)
              }}
            >
              <FolderOpen className="size-3.5" />
              {t('settings.help.logs')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!info}
              onClick={() => {
                if (info) void api.app.revealPath(info.configPath)
              }}
            >
              <Settings2 className="size-3.5" />
              {t('settings.help.config')}
            </Button>
          </div>
        </div>
      </section>
    </PageContainer>
  )
}

function SettingsTile({ card }: { card: CardSpec }) {
  const { t } = useTranslation()
  const Icon = card.icon

  return (
    <button
      type="button"
      onClick={() => navigate(`settings/${card.section}`)}
      className="group flex items-start gap-3.5 rounded-2xl border border-border bg-card p-[var(--card-pad)] text-left shadow-[0_1px_1px_rgba(16,16,20,0.03)] transition-[border-color,box-shadow] hover:border-foreground/10 hover:shadow-[0_10px_28px_-20px_rgba(16,16,20,0.35)]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/70">
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-medium">{t(`settings.cards.${card.titleKey}.title`)}</span>
          <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="mt-0.5 text-[12px] leading-[1.5] text-muted-foreground">
          {t(`settings.cards.${card.descKey}.desc`)}
        </p>
      </div>
    </button>
  )
}
