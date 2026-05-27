import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SocraticQuoteProps extends React.HTMLAttributes<HTMLQuoteElement> {
  children: React.ReactNode
}

function SocraticQuote({ className, children, ...props }: SocraticQuoteProps) {
  return (
    <blockquote
      className={cn(
        'border-l-4 border-[#f2cc0d] bg-yellow-50/40 pl-4 pr-3 py-3 rounded-r-md text-sm italic text-zinc-700 leading-relaxed',
        className,
      )}
      {...props}
    >
      {children}
    </blockquote>
  )
}

export { SocraticQuote }
