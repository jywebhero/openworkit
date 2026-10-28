import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/app/page'
import { navigate } from '@/lib/router'
import { cn } from '@/lib/utils'

export function SettingsSectionLayout({
  title,
  description,
  action,
  children
}: {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <PageContainer className="max-w-215">
      <button
        type="button"
        onClick={() => navigate('settings')}
        className="flex items-center gap-1.5 rounded-md text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {t('settings.back')}
      </button>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>

      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </PageContainer>
  )
}

export function SettingsCard({
  title,
  description,
  children,
  className
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn('rounded-2xl border border-border bg-card p-(--card-pad)', className)}
    >
      {title && (
        <div className="mb-1">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          {description && (
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="divide-y divide-border/70">{children}</div>
    </section>
  )
}

export function SettingRow({
  label,
  description,
  control,
  align = 'center'
}: {
  label: string
  description?: string
  control: ReactNode
  align?: 'center' | 'start'
}) {
  return (
    <div
      className={cn(
        'flex justify-between gap-6 py-(--row-pad) first:pt-2 last:pb-1',
        align === 'center' ? 'items-center' : 'items-start'
      )}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-medium">{label}</div>
        {description && (
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}
