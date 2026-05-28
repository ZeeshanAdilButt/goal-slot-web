import * as React from 'react'

import { cn } from '@/lib/utils'

interface JournalSparkProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Tiny 4-point brand-yellow star used as a decorative spark around the
 * Journal nav icon. Starts at zero opacity — the parent animates it via
 * the `journal-spark` keyframe (twinkle in, scale up, fade out).
 */
export function JournalSpark({ className, ...rest }: JournalSparkProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="#f2cc0d"
      aria-hidden="true"
      className={cn('h-2 w-2 opacity-0', className)}
      {...rest}
    >
      <path d="M8 0 L9.4 6.6 L16 8 L9.4 9.4 L8 16 L6.6 9.4 L0 8 L6.6 6.6 Z" />
    </svg>
  )
}
