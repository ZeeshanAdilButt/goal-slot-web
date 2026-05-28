import * as React from 'react'

import { cn } from '@/lib/utils'
import { StatusPill } from '@/components/ui/status-pill'

export interface PageHeaderProps {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  live?: { label: React.ReactNode }
  className?: string
}

function PageHeader({ title, eyebrow, description, actions, live, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-2 md:flex-row md:items-start md:justify-between', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        {eyebrow && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{eyebrow}</span>
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-zinc-900 md:text-2xl">{title}</h1>
          {live && (
            <StatusPill variant="live" dot>
              {live.label}
            </StatusPill>
          )}
        </div>
        {description && <p className="max-w-2xl text-xs leading-snug text-zinc-500 md:text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

export { PageHeader }
