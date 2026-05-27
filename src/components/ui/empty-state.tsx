import * as React from 'react'

import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6 gap-3',
        className,
      )}
    >
      {icon && (
        <div className="h-12 w-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 [&_svg]:size-5">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      {description && <p className="text-sm text-zinc-500 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
