import * as React from 'react'

import { cn } from '@/lib/utils'

export interface PageShellProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

function PageShell({ className, children, ...props }: PageShellProps) {
  return (
    <section
      className={cn('mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-7 screen-enter', className)}
      {...props}
    >
      {children}
    </section>
  )
}

export { PageShell }
