import * as React from 'react'

import { cn } from '@/lib/utils'

type StatusPillVariant = 'live' | 'success' | 'warning' | 'danger' | 'neutral' | 'brand'

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusPillVariant
  dot?: boolean
  mono?: boolean
}

const variantStyles: Record<StatusPillVariant, string> = {
  live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  brand: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-700',
}

const dotStyles: Record<StatusPillVariant, string> = {
  live: 'bg-emerald-500 animate-pulse',
  success: 'bg-emerald-500',
  warning: 'bg-yellow-500',
  danger: 'bg-rose-500',
  neutral: 'bg-zinc-400',
  brand: 'bg-[#f2cc0d]',
}

const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, variant = 'neutral', dot = false, mono = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
          variantStyles[variant],
          mono && 'font-mono',
          className,
        )}
        {...props}
      >
        {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />}
        {children}
      </span>
    )
  },
)
StatusPill.displayName = 'StatusPill'

export { StatusPill }
