import { useEffect, useMemo, useState } from 'react'
import {
  Copy,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  Link2,
  LoaderCircle,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  Trash2
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { InstalledSkill } from '@shared/types'
import { AgentLogo } from '@/components/app/agent-logo'
import { IconTile } from '@/components/app/icon-tile'
import { EmptyState, PageContainer, PageTitle, SectionLabel } from '@/components/app/page'
import { SymlinkMark } from '@/components/app/symlink-mark'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatBytes, formatDate } from '@/lib/format'
import { describeSkillDir } from '@/lib/agents'
import { api } from '@/lib/api'
import { navigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useSettings } from '@/providers/settings-provider'
import { useSkills } from '@/providers/skills-provider'

const NEUTRAL_TINT = { bg: 'var(--muted)', fg: 'var(--muted-foreground)' }

export function InstalledPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { settings } = useSettings()
  const { data, skills, loading, refresh, toggle, remove } = useSkills()

  const [query, setQuery] = useState('')
  const [activeDirId, setActiveDirId] = useState<string | null>(null)
  const [selected, setSelected] = useState<InstalledSkill | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<InstalledSkill | null>(null)

  useEffect(() => {
    const handler = (): void => {
      document.getElementById('installed-search')?.focus()
    }
    window.addEventListener('openwork:focus-search', handler)
    return () => window.removeEventListener('openwork:focus-search', handler)
  }, [])

  useEffect(() => {
    if (!selected) {
      setContent(null)
      return
    }
    let active = true
    setContent(null)
    setContentLoading(true)
    void api.skills
      .read(selected.path)
      .then((result) => {
        if (active) setContent(result.content)
      })
      .catch(() => {
        if (active) setContent('')
      })
      .finally(() => {
        if (active) setContentLoading(false)
      })
    return () => {
      active = false
    }
  }, [selected])

  const describeError = (error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('outside the configured')) return t('toasts.forbidden')
    return message
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return skills
    return skills.filter((skill) => {
      const haystack =
        `${skill.meta.name} ${skill.meta.description} ${skill.slug} ${skill.dirLabel}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [query, skills])

  const matchesByDir = useMemo(() => {
    const byDir = new Map<string, InstalledSkill[]>()
    for (const skill of filtered) {
      const list = byDir.get(skill.dirId) ?? []
      list.push(skill)
      byDir.set(skill.dirId, list)
    }
    return byDir
  }, [filtered])

  const agentTabs = useMemo(() => {
    if (!data) return []
    const entries = data.dirs
      .filter((dir) => dir.enabled && dir.exists)
      .map((dir) => {
        const agent = describeSkillDir(dir)
        return { dir, agent, label: agent.label }
      })
    const labelCounts = new Map<string, number>()
    for (const entry of entries) {
      labelCounts.set(entry.label, (labelCounts.get(entry.label) ?? 0) + 1)
    }
    return entries.map((entry) => ({
      ...entry,
      label:
        (labelCounts.get(entry.label) ?? 0) > 1
          ? `${entry.label} · ${
              entry.dir.scope === 'project'
                ? t('installed.projectScope')
                : t('installed.userScope')
            }`
          : entry.label
    }))
  }, [data, t])

  const activeTab =
    agentTabs.find((tab) => tab.dir.id === activeDirId) ??
    agentTabs.find((tab) => tab.dir.isInstallTarget) ??
    agentTabs[0]

  const hasEnabledDir = agentTabs.length > 0

  const handleToggle = async (skill: InstalledSkill, enabled: boolean): Promise<void> => {
    try {
      if (selected?.path === skill.path) setSelected(null)
      await toggle(skill, enabled)
      toast.success(
        t(enabled ? 'installed.enabledToast' : 'installed.disabledToast', { name: skill.meta.name })
      )
    } catch (error) {
      toast.error(t('toasts.error'), { description: describeError(error) })
    }
  }

  const performDelete = async (skill: InstalledSkill): Promise<void> => {
    try {
      await remove(skill)
      toast.success(t('installed.deleted', { name: skill.meta.name }))
      if (selected?.path === skill.path) setSelected(null)
    } catch (error) {
      toast.error(t('toasts.error'), { description: describeError(error) })
    }
  }

  const requestDelete = (skill: InstalledSkill): void => {
    if (settings.confirmDelete) {
      setPendingDelete(skill)
      return
    }
    void performDelete(skill)
  }

  const copyPath = async (value: string): Promise<void> => {
    await api.app.copyText(value)
    toast.success(t('installed.copiedPath'))
  }

  return (
    <PageContainer>
      <PageTitle
        title={t('installed.title')}
        description={t('installed.subtitle', {
          count: skills.length,
          dirs: data?.dirs.filter((dir) => dir.count > 0).length ?? 0
        })}
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="installed-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('installed.searchPlaceholder')}
                className="h-9 w-[210px] pl-8"
              />
            </div>
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="outline" size="icon" className="h-9 w-9" onClick={() => void refresh()} />}
              >
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              </TooltipTrigger>
              <TooltipContent>{t('common.rescan')}</TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              className="h-9 gap-2 px-3 text-[13px]"
              disabled={!activeTab}
              onClick={() => {
                if (activeTab) void api.skills.open(activeTab.dir.path)
              }}
            >
              <FolderOpen className="size-4 text-muted-foreground" />
              {t('installed.openCurrentDir')}
            </Button>
          </>
        }
      />

      {!data ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : !hasEnabledDir ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title={t('installed.emptyNoDirsTitle')}
          description={t('installed.emptyNoDirsDesc')}
          action={
            <Button size="sm" onClick={() => navigate('settings/dirs')}>
              {t('nav.settings')}
            </Button>
          }
        />
      ) : skills.length === 0 ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title={t('installed.emptyTitle')}
          description={t('installed.emptyDesc')}
          action={
            <Button size="sm" onClick={() => navigate('market')}>
              {t('installed.browse')}
            </Button>
          }
        />
      ) : activeTab ? (
        <Tabs value={activeTab.dir.id} onValueChange={setActiveDirId} className="gap-4">
          <TabsList className="gap-0.5">
            {agentTabs.map(({ dir, agent, label }) => (
              <TabsTrigger key={dir.id} value={dir.id} title={dir.path}>
                <AgentLogo logo={agent.logo} />
                <span className="max-w-[160px] truncate">{label}</span>
                <span className="min-w-[18px] rounded-full bg-muted px-1.5 py-px text-center text-[10px] leading-[14px] font-medium text-muted-foreground tabular-nums">
                  {matchesByDir.get(dir.id)?.length ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {agentTabs.map(({ dir }) => {
            const items = matchesByDir.get(dir.id) ?? []
            return (
              <TabsContent key={dir.id} value={dir.id}>
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">
                    {dir.path}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {dir.scope === 'project'
                      ? t('installed.projectScope')
                      : t('installed.userScope')}
                  </Badge>
                  {dir.isInstallTarget && (
                    <Badge variant="secondary" className="shrink-0">
                      {t('settings.dirs.installTarget')}
                    </Badge>
                  )}
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="ml-auto shrink-0 text-muted-foreground"
                          onClick={() => void api.skills.open(dir.path)}
                        />
                      }
                    >
                      <FolderOpen className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>{t('common.open')}</TooltipContent>
                  </Tooltip>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
                    <p className="text-[12.5px] font-medium">
                      {query.trim()
                        ? t('installed.noMatchTitle')
                        : t('installed.noSkillsInDirTitle')}
                    </p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      {query.trim()
                        ? t('installed.noMatchDesc')
                        : t('installed.noSkillsInDirDesc')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    {items.map((skill, index) => (
                      <div
                        key={skill.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelected(skill)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelected(skill)
                          }
                        }}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 px-4 py-[var(--row-pad)] transition-colors hover:bg-accent/40',
                          index > 0 && 'border-t border-border/70'
                        )}
                      >
                        <div className="relative shrink-0">
                          <IconTile icon={FileText} tint={NEUTRAL_TINT} size="sm" />
                          {skill.isSymlink && <SymlinkMark target={skill.linkTarget} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'truncate text-[13.5px] font-medium',
                                !skill.enabled && 'text-muted-foreground'
                              )}
                            >
                              {skill.meta.name}
                            </span>
                            {skill.meta.version && (
                              <span className="shrink-0 text-[10.5px] text-muted-foreground">
                                v{skill.meta.version}
                              </span>
                            )}
                            {!skill.enabled && (
                              <Badge variant="muted">{t('installed.disabled')}</Badge>
                            )}
                            {!skill.hasFrontmatter && (
                              <Badge variant="outline">{t('installed.detail.missingFrontmatter')}</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                            {skill.meta.description || skill.folder}
                          </p>
                        </div>

                        <div
                          className="flex shrink-0 items-center gap-1.5"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <Tooltip>
                            <TooltipTrigger render={<span />}>
                              <Switch
                                checked={skill.enabled}
                                onCheckedChange={(checked) => void handleToggle(skill, checked)}
                                aria-label={
                                  skill.enabled ? t('installed.disable') : t('installed.enable')
                                }
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {skill.enabled ? t('installed.disable') : t('installed.enable')}
                            </TooltipContent>
                          </Tooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={<Button variant="ghost" size="icon-sm" className="text-muted-foreground" />}
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[190px]">
                              <DropdownMenuItem onClick={() => setSelected(skill)}>
                                <Eye />
                                {t('installed.view')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void api.skills.reveal(skill.path)}>
                                <FolderOpen />
                                {t('installed.openFolder')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void handleToggle(skill, !skill.enabled)}>
                                {skill.enabled ? t('installed.disable') : t('installed.enable')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive [&_svg]:text-destructive"
                                onClick={() => requestDelete(skill)}
                              >
                                <Trash2 />
                                {t('installed.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      ) : null}

      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <SheetContent>
          {selected && (
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-8">
                <SheetHeader>
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <IconTile icon={FileText} tint={NEUTRAL_TINT} />
                      {selected.isSymlink && <SymlinkMark target={selected.linkTarget} />}
                    </div>
                    <div className="min-w-0">
                      <SheetTitle>{selected.meta.name}</SheetTitle>
                      <SheetDescription className="truncate font-mono text-[11.5px]">
                        {selected.folder}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                {selected.meta.description && (
                  <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground selectable">
                    {selected.meta.description}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-1.5">
                  <Badge variant={selected.enabled ? 'success' : 'muted'}>
                    {selected.enabled ? t('installed.enable') : t('installed.disabled')}
                  </Badge>
                  <Badge variant="outline">
                    {selected.scope === 'project'
                      ? t('installed.projectScope')
                      : t('installed.userScope')}
                  </Badge>
                  {selected.meta.version && <Badge variant="outline">v{selected.meta.version}</Badge>}
                  {selected.meta.license && (
                    <Badge variant="outline">{selected.meta.license}</Badge>
                  )}
                  {selected.meta.allowedTools.map((tool) => (
                    <Badge key={tool} variant="secondary" className="font-mono">
                      {tool}
                    </Badge>
                  ))}
                </div>

                {selected.isSymlink && selected.linkTarget && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/25 px-4 py-2.5">
                    <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {t('installed.detail.linkTarget')}
                    </span>
                    <span className="min-w-0 truncate font-mono text-[11px] selectable">
                      {selected.linkTarget}
                    </span>
                  </div>
                )}

                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-border bg-muted/25 p-4 text-[12px]">
                  <Meta label={t('installed.detail.updated')} value={formatDate(selected.mtimeMs, language)} />
                  <Meta
                    label={t('installed.detail.filesLabel')}
                    value={t('installed.detail.files', { count: selected.files })}
                  />
                  <Meta label={t('installed.detail.size')} value={formatBytes(selected.bytes)} />
                  <Meta label={t('installed.detail.license')} value={selected.meta.license ?? '—'} />
                </dl>

                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-2">
                    <SectionLabel>SKILL.md</SectionLabel>
                    <span className="truncate font-mono text-[10.5px] text-muted-foreground/80">
                      {selected.path}
                    </span>
                    {contentLoading && (
                      <LoaderCircle className="size-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="rounded-xl border border-border bg-muted/25 p-4">
                    {contentLoading ? (
                      <div className="flex h-24 items-center justify-center text-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin" />
                      </div>
                    ) : (
                      <pre className="skill-markdown scrollbar-none max-h-[46vh] overflow-auto selectable">
                        {content ?? ''}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 border-t border-border px-6 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void api.skills.reveal(selected.path)}
                >
                  <FolderOpen className="size-3.5" />
                  {t('installed.openFolder')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void copyPath(selected.path)}>
                  <Copy className="size-3.5" />
                  {t('common.copy')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-destructive hover:text-destructive"
                  onClick={() => requestDelete(selected)}
                >
                  <Trash2 className="size-3.5" />
                  {t('installed.delete')}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {t('installed.deleteTitle', { name: pendingDelete?.meta.name ?? '' })}
            </DialogTitle>
            <DialogDescription>{t('installed.deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) void performDelete(pendingDelete)
                setPendingDelete(null)
              }}
            >
              {t('installed.deleteConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] tracking-[0.06em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{value}</dd>
    </div>
  )
}
