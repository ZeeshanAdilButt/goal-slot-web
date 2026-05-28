import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SocraticQuoteProps extends React.HTMLAttributes<HTMLQuoteElement> {
  children: React.ReactNode
}

function SocraticQuote({ className, children, ...props }: SocraticQuoteProps) {
  return (
    <blockquote
      className={cn(
        'rounded-r-md border-l-4 border-[#f2cc0d] bg-yellow-50/40 py-3 pl-4 pr-3 text-sm leading-relaxed text-zinc-700',
        className,
      )}
      {...props}
    >
      {children}
    </blockquote>
  )
}

export { SocraticQuote }
