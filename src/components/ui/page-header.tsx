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
    <header className={cn('space-y-1', className)}>
      {/* Row 1: title (and eyebrow / live pill) on the left, actions
          anchored to the right. justify-between keeps actions on the
          right edge even when the title is short. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-baseline gap-2">
          {eyebrow && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {eyebrow}
            </span>
          )}
          <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-zinc-900 sm:text-xl">
            {title}
          </h1>
          {live && (
            <StatusPill variant="live" dot>
              {live.label}
            </StatusPill>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {/* Row 2: description as a secondary line so it never pushes the
          right-side actions to wrap below. */}
      {description && (
        <p className="max-w-2xl text-xs leading-snug text-zinc-500">{description}</p>
      )}
    </header>
  )
}

export { PageHeader }
