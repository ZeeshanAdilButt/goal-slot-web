import * as React from 'react'

import { cn } from '@/lib/utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  hover?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, padded = true, hover = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border border-zinc-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)]',
          hover &&
            'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.04)] hover:border-zinc-300',
          padded && 'p-6',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
GlassCard.displayName = 'GlassCard'

export { GlassCard }
