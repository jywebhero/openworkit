import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  MarketListResult,
  MarketSkill,
  MarketSummary,
  MarketView
} from '@shared/types'
import {
  ArrowDownToLine,
  BadgeCheck,
  Check,
  ChevronDown,
  CloudOff,
  Copy,
  ExternalLink,
  Flame,
  LoaderCircle,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  SquareTerminal,
  TrendingUp
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { IconTile } from '@/components/app/icon-tile'
import { EmptyState, PageContainer, PageTitle } from '@/components/app/page'
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
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import { formatCount } from '@/lib/format'
import { marketVisual } from '@/lib/market-visual'
import { navigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useSkills } from '@/providers/skills-provider'

type SortKey = 'overall' | 'installs' | 'weekly' | 'name'

const VIEWS: MarketView[] = ['recommended', 'trending', 'hot', 'official']
const SORTS: SortKey[] = ['overall', 'installs', 'weekly', 'name']
const PAGE_SIZE = 24

function commandFor(skill: MarketSkill): string {
  return skill.github
    ? `npx skills add https://github.com/${skill.source} --skill ${skill.skillId}`
    : `npx skills add https://${skill.source}/`
}

export function MarketPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const { skills, installedSlugs, refresh, importFolder, installDir } = useSkills()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [view, setView] = useState<MarketView>('recommended')
  const [sort, setSort] = useState<SortKey>('overall')
  const [list, setList] = useState<MarketListResult | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadToken, setReloadToken] = useState(0)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [summaries, setSummaries] = useState<Record<string, MarketSummary>>({})
  const [featuredPool, setFeaturedPool] = useState<MarketSkill[]>([])
  const [featuredReady, setFeaturedReady] = useState(false)
  const [featuredOffset, setFeaturedOffset] = useState(0)
  const [installingId, setInstallingId] = useState<string | null>(null)
  const [detail, setDetail] = useState<MarketSkill | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [importing, setImporting] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef(0)

  useEffect(() => {
    const handler = (): void => {
      searchRef.current?.focus()
      searchRef.current?.select()
    }
    window.addEventListener('openwork:focus-search', handler)
    return () => window.removeEventListener('openwork:focus-search', handler)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [query])

  const load = useCallback(async () => {
    const needle = debouncedQuery.trim()
    const searching = needle.length >= 2
    const request = requestRef.current + 1
    requestRef.current = request
    setStatus('loading')
    setList((prev) => {
      if (!prev) return prev
      if (searching) return prev.view === 'search' && prev.query === needle ? prev : null
      return prev.view === view ? prev : null
    })
    try {
      const next = searching ? await api.market.search(needle) : await api.market.list(view)
      if (requestRef.current !== request) return
      setList(next)
      setStatus('ready')
    } catch {
      if (requestRef.current !== request) return
      setStatus('error')
    }
  }, [debouncedQuery, view])

  useEffect(() => {
    void load()
  }, [load, reloadToken])

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [list])

  useEffect(() => {
    let cancelled = false
    api.market
      .list('trending')
      .then((result) => {
        if (cancelled) return
        setFeaturedPool(result.skills.slice(0, 12))
        setFeaturedReady(true)
      })
      .catch(() => {
        if (!cancelled) setFeaturedReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const featured = useMemo(() => {
    if (featuredPool.length === 0) return []
    const size = Math.min(3, featuredPool.length)
    const offset = (featuredOffset * size) % featuredPool.length
    return Array.from({ length: size }, (_, index) => featuredPool[(offset + index) % featuredPool.length])
  }, [featuredOffset, featuredPool])

  const sorted = useMemo(() => {
    const next = [...(list?.skills ?? [])]
    if (sort === 'installs') next.sort((a, b) => b.installs - a.installs)
    else if (sort === 'weekly') next.sort((a, b) => (b.weekly ?? b.installs) - (a.weekly ?? a.installs))
    else if (sort === 'name') next.sort((a, b) => a.name.localeCompare(b.name))
    return next
  }, [list, sort])

  const visibleSkills = useMemo(() => sorted.slice(0, visible), [sorted, visible])

  const hydrateTargets = useMemo(() => {
    const targets = new Map<string, { source: string; skillId: string }>()
    for (const skill of [...featured, ...visibleSkills]) {
      if (!summaries[skill.id]) targets.set(skill.id, { source: skill.source, skillId: skill.skillId })
    }
    return [...targets.values()]
  }, [featured, visibleSkills, summaries])

  const hydrateKey = hydrateTargets.map((item) => `${item.source}/${item.skillId}`).join('|')

  useEffect(
    () =>
      api.market.onSummary((batch) => {
        setSummaries((prev) => ({ ...prev, ...batch }))
      }),
    []
  )

  useEffect(() => {
    if (!hydrateKey) return
    let cancelled = false
    void api.market
      .describe(hydrateTargets)
      .then((result) => {
        if (cancelled) return
        setSummaries((prev) => ({ ...prev, ...result }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // Targets are keyed by hydrateKey; identity churn should not retrigger the fetch.
  }, [hydrateKey])

  const isInstalled = (skill: MarketSkill): boolean =>
    installedSlugs.has(skill.skillId.toLowerCase())

  const install = useCallback(
    async (skill: MarketSkill): Promise<void> => {
      if (installingId) return
      if (!skill.github) {
        setDetail(skill)
        return
      }
      setInstallingId(skill.id)
      try {
        const result = await api.market.install(skill.source, skill.skillId)
        if (result.ok) {
          await refresh()
          setDetail(null)
          toast.success(t('market.installSuccess', { name: skill.name }))
          return
        }
        if (result.error === 'exists') {
          toast.error(t('market.installExists', { name: skill.name }))
        } else if (result.error === 'not-found') {
          toast.error(t('market.installNotFound', { name: skill.name }))
        } else if (result.error === 'unsupported') {
          setDetail(skill)
          toast(t('market.installUnsupported', { source: skill.source }))
        } else {
          toast.error(t('market.installFailed', { name: skill.name }))
        }
      } catch {
        toast.error(t('market.installFailed', { name: skill.name }))
      } finally {
        setInstallingId(null)
      }
    },
    [installingId, refresh, t]
  )

  const handleImport = async (): Promise<void> => {
    setImporting(true)
    try {
      const result = await importFolder()
      if (!result) return
      if (result.ok) {
        const name = result.path?.split('/').pop() ?? ''
        toast.success(t('market.addDialog.added', { name }))
        setAddOpen(false)
      } else if (result.error === 'invalid') {
        toast.error(t('market.addDialog.noSkillFile'))
      } else if (result.error === 'exists') {
        toast.error(t('market.addDialog.exists'))
      } else {
        toast.error(t('market.addDialog.failed'))
      }
    } catch {
      toast.error(t('market.addDialog.failed'))
    } finally {
      setImporting(false)
    }
  }

  const searching = debouncedQuery.length >= 2
  const metricLabel = t(
    list?.view === 'trending' || list?.view === 'hot'
      ? 'market.metrics.last24h'
      : 'market.metrics.allTime'
  )
  const availableSorts =
    list?.view === 'trending' || list?.view === 'hot'
      ? SORTS.filter((item) => item !== 'weekly')
      : SORTS

  const renderCard = (skill: MarketSkill, featuredCard = false) => (
    <MarketCard
      key={skill.id}
      skill={skill}
      summary={summaries[skill.id]}
      featured={featuredCard}
      installed={isInstalled(skill)}
      installing={installingId === skill.id}
      metricLabel={metricLabel}
      language={language}
      onInstall={() => void install(skill)}
      onOpen={() => setDetail(skill)}
    />
  )

  return (
    <PageContainer wide>
      <PageTitle
        title={t('market.title')}
        description={t('market.subtitle')}
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('common.search')}
                className="h-9 w-[210px] pl-8"
              />
            </div>
            <Button
              variant="outline"
              className="h-9 gap-2 px-3 text-[13px]"
              onClick={() => navigate('installed')}
            >
              <PackageCheck className="size-4 text-muted-foreground" />
              {t('market.installedCount', { count: skills.length })}
            </Button>
            <Button className="h-9 gap-1.5 px-3.5" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              {t('market.addSkill')}
            </Button>
          </>
        }
      />

      {!searching && (featured.length > 0 || !featuredReady) && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13.5px] font-semibold">{t('market.featured')}</h2>
            <button
              type="button"
              onClick={() => setFeaturedOffset((value) => value + 1)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RefreshCw className="size-3.5" />
              {t('market.shuffle')}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            {featured.length === 0
              ? Array.from({ length: 3 }, (_, index) => <CardSkeleton key={index} featured />)
              : featured.map((skill) => renderCard(skill, true))}
          </div>
        </section>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {VIEWS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setSort('overall')
                setView(item)
              }}
              className={cn(
                'h-8 rounded-lg px-2.5 text-[13.5px] transition-colors',
                !searching && view === item
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
              )}
            >
              {t(`market.tabs.${item}`)}
            </button>
          ))}
          {searching && (
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {t('market.searchingFor', { query: debouncedQuery })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'loading' && <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" />}
          <div className="inline-flex items-center rounded-lg bg-muted/80 p-0.5">
            {availableSorts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSort(item)}
                className={cn(
                  'h-[26px] rounded-md px-2.5 text-[11.5px] transition-colors',
                  sort === item
                    ? 'bg-card font-medium text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(`market.sort.${item}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {status === 'error' && !list ? (
        <div className="mt-4">
          <EmptyState
            icon={<CloudOff className="size-5" />}
            title={t('market.errorTitle')}
            description={t('market.errorDesc')}
            action={
              <Button variant="outline" className="gap-2" onClick={() => setReloadToken((value) => value + 1)}>
                <RefreshCw className="size-4" />
                {t('common.retry')}
              </Button>
            }
          />
        </div>
      ) : !list || (status === 'loading' && visibleSkills.length === 0) ? (
        <div className="mt-4 grid grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : visibleSkills.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Search className="size-5" />}
            title={t('market.emptyTitle')}
            description={t('market.emptyDesc')}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3.5">
            {visibleSkills.map((skill) => renderCard(skill))}
          </div>
          {visible < sorted.length && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                className="gap-2 text-[12.5px]"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
              >
                <ChevronDown className="size-4" />
                {t('market.loadMore', { shown: visibleSkills.length, total: sorted.length })}
              </Button>
            </div>
          )}
        </>
      )}

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => void api.app.openExternal('https://www.skills.sh')}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-muted-foreground/80 transition-colors hover:text-foreground"
        >
          <span className="size-1.5 rounded-full bg-success" />
          {t('market.liveNote')}
        </button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{t('market.addDialog.title')}</DialogTitle>
            <DialogDescription>{t('market.addDialog.desc')}</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
            <div className="text-[10.5px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {t('market.addDialog.target')}
            </div>
            <div className="mt-1 truncate font-mono text-[11.5px]">{installDir || '—'}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void handleImport()} disabled={importing}>
              {importing && <LoaderCircle className="size-4 animate-spin" />}
              {importing ? t('market.addDialog.importing') : t('market.addDialog.chooseFolder')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SkillDetailDialog
        skill={detail}
        summary={detail ? summaries[detail.id] : undefined}
        installed={detail ? isInstalled(detail) : false}
        installing={!!detail && installingId === detail.id}
        language={language}
        metricLabel={metricLabel}
        onClose={() => setDetail(null)}
        onInstall={() => {
          if (detail) void install(detail)
        }}
      />
    </PageContainer>
  )
}

function MarketCard({
  skill,
  summary,
  featured = false,
  installed,
  installing,
  metricLabel,
  language,
  onInstall,
  onOpen
}: {
  skill: MarketSkill
  summary?: MarketSummary
  featured?: boolean
  installed: boolean
  installing: boolean
  metricLabel: string
  language: string
  onInstall: () => void
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const visual = marketVisual(skill.source)

  return (
    <article
      onClick={onOpen}
      className={cn(
        'group flex cursor-pointer flex-col rounded-2xl border border-border/80 bg-card p-[var(--card-pad)] shadow-[0_1px_1px_rgba(16,16,20,0.03)]',
        'transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-[0_10px_28px_-18px_rgba(16,16,20,0.35)]'
      )}
    >
      <div className="flex items-start gap-3.5">
        <IconTile icon={visual.icon} tint={visual.tint} size={featured ? 'lg' : 'md'} />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="min-w-0 truncate text-[14.5px] leading-6 font-semibold tracking-[-0.01em]">
                  {skill.name}
                </h3>
                {skill.official && (
                  <Tooltip>
                    <TooltipTrigger render={<BadgeCheck className="size-3.5 shrink-0 text-sky-500" />} />
                    <TooltipContent>{t('market.official')}</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="truncate font-mono text-[10.5px] text-muted-foreground/75">
                {skill.source}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      if (!installed) onInstall()
                    }}
                    disabled={installing}
                    aria-label={t('market.install')}
                    className={cn(
                      'app-no-drag -mt-0.5 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                      installed
                        ? 'cursor-default border-success/25 bg-success/10 text-success'
                        : 'border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-foreground',
                      installing && 'opacity-70'
                    )}
                  />
                }
              >
                {installing ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : installed ? (
                  <Check className="size-3.5" />
                ) : (
                  <Plus className="size-3.5" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {installed
                  ? t('common.installed')
                  : skill.github
                    ? t('market.install')
                    : t('market.viewCommand')}
              </TooltipContent>
            </Tooltip>
          </div>
          {summary ? (
            summary.description ? (
              <p className="mt-1 line-clamp-2 min-h-[2.6em] text-[12.5px] leading-[1.55] text-muted-foreground">
                {summary.description}
              </p>
            ) : (
              <p className="mt-1 min-h-[2.6em] text-[12.5px] leading-[1.55] text-muted-foreground/60 italic">
                {t('market.noDescription')}
              </p>
            )
          ) : (
            <div className="mt-2 min-h-[2.6em] animate-pulse rounded-md bg-muted/60" />
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-4 pt-4 text-[11.5px] text-muted-foreground">
        <Tooltip>
          <TooltipTrigger
            render={<span className="flex items-center gap-1.5" />}
          >
            <ArrowDownToLine className="size-3.5" />
            {formatCount(skill.installs, language)}
          </TooltipTrigger>
          <TooltipContent>{metricLabel}</TooltipContent>
        </Tooltip>
        {skill.weekly != null && (
          <Tooltip>
            <TooltipTrigger
              render={<span className="flex items-center gap-1.5" />}
            >
              <TrendingUp className="size-3.5" />
              {formatCount(skill.weekly, language)}
            </TooltipTrigger>
            <TooltipContent>{t('market.metrics.thisWeek')}</TooltipContent>
          </Tooltip>
        )}
        {skill.change != null && skill.change > 0 && (
          <span className="flex items-center gap-1 font-medium text-success">
            <Flame className="size-3.5" />
            {`+${skill.change}%`}
          </span>
        )}
        {installed && (
          <Badge variant="success" className="ml-auto">
            <Check />
            {t('common.installed')}
          </Badge>
        )}
      </div>
    </article>
  )
}

function CardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-[var(--card-pad)]">
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'animate-pulse rounded-[14px] bg-muted',
            featured ? 'size-14' : 'size-[46px]'
          )}
        />
        <div className="flex-1 space-y-2 pt-1.5">
          <div className="h-3.5 w-2/5 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted/70" />
          <div className="h-8 animate-pulse rounded bg-muted/60" />
        </div>
      </div>
      <div className="mt-auto flex gap-4 pt-4">
        <div className="h-3 w-12 animate-pulse rounded bg-muted/60" />
        <div className="h-3 w-12 animate-pulse rounded bg-muted/60" />
      </div>
    </div>
  )
}

function SkillDetailDialog({
  skill,
  summary,
  installed,
  installing,
  language,
  metricLabel,
  onClose,
  onInstall
}: {
  skill: MarketSkill | null
  summary?: MarketSummary
  installed: boolean
  installing: boolean
  language: string
  metricLabel: string
  onClose: () => void
  onInstall: () => void
}) {
  const { t } = useTranslation()
  const visual = skill ? marketVisual(skill.source) : null
  const command = summary?.command || (skill ? commandFor(skill) : '')

  return (
    <Dialog open={!!skill} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-[560px]">
        {skill && visual && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3.5">
                <IconTile icon={visual.icon} tint={visual.tint} />
                <div className="min-w-0 flex-1">
                  <DialogTitle className="flex items-center gap-2">
                    <span className="truncate">{skill.name}</span>
                    {skill.official && (
                      <Badge variant="secondary" className="shrink-0">
                        <BadgeCheck />
                        {t('market.official')}
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 font-mono">
                    {skill.source}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {summary?.description || (summary ? t('market.noDescription') : t('common.loading'))}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ArrowDownToLine className="size-3.5" />
                {formatCount(skill.installs, language)}
                <span className="text-[11px] text-muted-foreground/70">{metricLabel}</span>
              </span>
              {skill.weekly != null && (
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" />
                  {formatCount(skill.weekly, language)}
                  <span className="text-[11px] text-muted-foreground/70">
                    {t('market.metrics.thisWeek')}
                  </span>
                </span>
              )}
              {skill.yesterday != null && (
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" />
                  {formatCount(skill.yesterday, language)}
                  <span className="text-[11px] text-muted-foreground/70">
                    {t('market.metrics.yesterday')}
                  </span>
                </span>
              )}
            </div>

            <div className="min-w-0 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10.5px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  {t('market.detail.command')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void api.app.copyText(command)
                    toast.success(t('common.copied'))
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Copy className="size-3.5" />
                  {t('common.copy')}
                </button>
              </div>
              <code className="mt-1.5 block font-mono text-[11.5px] break-words whitespace-pre-wrap">{command}</code>
            </div>

            {!skill.github && (
              <p className="flex items-start gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
                <SquareTerminal className="mt-0.5 size-3.5 shrink-0" />
                {t('market.detail.cliHint', { source: skill.source })}
              </p>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => void api.app.openExternal(skill.url)}
              >
                <ExternalLink className="size-4" />
                {t('market.detail.openPage')}
              </Button>
              {skill.github ? (
                <Button className="gap-2" disabled={installed || installing} onClick={onInstall}>
                  {installing ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : installed ? (
                    <Check className="size-4" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {installed
                    ? t('common.installed')
                    : installing
                      ? t('market.installing')
                      : t('market.install')}
                </Button>
              ) : (
                <Button
                  className="gap-2"
                  onClick={() => {
                    void api.app.copyText(command)
                    toast.success(t('common.copied'))
                  }}
                >
                  <Copy className="size-4" />
                  {t('market.detail.copyCommand')}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
