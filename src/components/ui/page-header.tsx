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
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-1',
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <div className="flex items-baseline gap-2">
          {eyebrow && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {eyebrow}
            </span>
          )}
          <h1 className="text-lg font-bold leading-tight tracking-tight text-zinc-900 sm:text-xl">
            {title}
          </h1>
          {live && (
            <StatusPill variant="live" dot>
              {live.label}
            </StatusPill>
          )}
        </div>
        {description && (
          <p className="max-w-2xl text-xs leading-snug text-zinc-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  )
}

export { PageHeader }
