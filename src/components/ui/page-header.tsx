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
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-start md:justify-between', className)}>
      <div className="flex flex-col gap-2 min-w-0">
        {eyebrow && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{eyebrow}</span>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight tracking-tight">{title}</h1>
          {live && (
            <StatusPill variant="live" dot>
              {live.label}
            </StatusPill>
          )}
        </div>
        {description && <p className="text-sm text-zinc-500 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

export { PageHeader }
