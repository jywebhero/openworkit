import { useCallback, useEffect, useState } from 'react'
import { FolderCog, LoaderCircle, Plug, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ConnectorScanResult } from '@shared/types'
import { AgentLogo } from '@/components/app/agent-logo'
import { EmptyState, PageContainer, PageTitle, SectionLabel } from '@/components/app/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { agentMark } from '@/lib/agents'
import { cn } from '@/lib/utils'

export function ConnectorsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<ConnectorScanResult | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.connectors.scan())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <PageContainer>
      <PageTitle
        title={t('connectors.title')}
        description={t('connectors.subtitle')}
        actions={
          <Button
            variant="outline"
            className="h-9 gap-2 px-3 text-[13px]"
            onClick={() => void load()}
          >
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            {t('common.refresh')}
          </Button>
        }
      />

      {!data ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : data.servers.length === 0 ? (
        <EmptyState
          icon={<Plug className="size-5" />}
          title={t('connectors.emptyTitle')}
          description={t('connectors.emptyDesc')}
        />
      ) : (
        <>
          <section>
            <SectionLabel className="mb-3">{t('connectors.servers')}</SectionLabel>
            <div className="grid grid-cols-2 gap-3.5">
              {data.servers.map((server) => {
                const agent = agentMark(server.agent)
                return (
                  <div
                    key={server.id}
                    className="rounded-2xl border border-border bg-card p-[var(--card-pad)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-muted text-muted-foreground">
                        <AgentLogo logo={agent?.logo ?? null} className="size-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-[13.5px] font-medium">{server.name}</h3>
                          {agent && (
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {agent.label}
                            </span>
                          )}
                          <Badge variant="outline" className="ml-auto font-mono text-[10px]">
                            {t(`connectors.transport.${server.transport}`)}
                          </Badge>
                        </div>
                        <p
                          className="mt-1 truncate font-mono text-[11px] text-muted-foreground"
                          title={server.command ?? server.url}
                        >
                          {server.command ?? server.url}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant="secondary">
                            {server.scope === 'project'
                              ? t('connectors.scope.project')
                              : t('connectors.scope.user')}
                          </Badge>
                          <span className="truncate font-mono" title={server.source}>
                            {server.source}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="ml-auto shrink-0 text-muted-foreground"
                            onClick={() => void api.connectors.openConfig(server.source)}
                          >
                            <FolderCog className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-8">
            <SectionLabel className="mb-3">{t('connectors.configFiles')}</SectionLabel>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {data.files.map((file, index) => {
                const agent = agentMark(file.agent)
                return (
                  <div
                    key={file.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-[var(--row-pad)]',
                      index > 0 && 'border-t border-border/70'
                    )}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-muted text-muted-foreground">
                      <AgentLogo logo={agent?.logo ?? null} className="size-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[11.5px]" title={file.path}>
                        {file.path}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {agent ? `${agent.label} · ` : ''}
                        {file.count > 0
                          ? t('connectors.serverCount', { count: file.count })
                          : t('connectors.noServers')}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void api.connectors.openConfig(file.path)}
                    >
                      {t('connectors.openConfig')}
                    </Button>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </PageContainer>
  )
}
