import * as React from 'react'

import { cn } from '@/lib/utils'

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-700',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

export { Kbd }
