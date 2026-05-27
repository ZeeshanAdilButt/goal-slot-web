import * as React from 'react'

import { cn } from '@/lib/utils'

export interface PageShellProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

function PageShell({ className, children, ...props }: PageShellProps) {
  return (
    <section
      className={cn('max-w-6xl mx-auto px-6 md:px-12 py-10 space-y-10 screen-enter', className)}
      {...props}
    >
      {children}
    </section>
  )
}

export { PageShell }
