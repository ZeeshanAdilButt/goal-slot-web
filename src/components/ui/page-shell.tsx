import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * 'default' caps the content column at max-w-6xl (1152px), which keeps
 * text-heavy pages (settings, goals, reports) at a comfortable reading
 * measure. 'wide' opts out of that cap for table-like pages whose content
 * is legitimately as wide as the viewport allows — the weekly schedule
 * grid, the admin user table — so they use the full space next to the
 * sidebar instead of scrolling horizontally inside a 1152px column while
 * page margin sits empty on both sides.
 */
export type PageShellWidth = 'default' | 'wide'

export interface PageShellProps extends React.HTMLAttributes<HTMLElement> {
  width?: PageShellWidth
  children: React.ReactNode
}

function PageShell({ className, width = 'default', children, ...props }: PageShellProps) {
  return (
    <section
      className={cn(
        'mx-auto space-y-6 px-4 py-6 md:px-8 md:py-7 screen-enter',
        width === 'wide' ? 'max-w-none' : 'max-w-6xl',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export { PageShell }
