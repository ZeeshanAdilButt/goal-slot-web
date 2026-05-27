import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  title: React.ReactNode
  action?: React.ReactNode
  className?: string
}

function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-4', className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export { SectionHeader }
