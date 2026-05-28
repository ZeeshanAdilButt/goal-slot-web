import * as React from 'react'

import { cn } from '@/lib/utils'

interface CoachIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Custom Coach icon — a north-star compass: outer ring suggests "all your
 * context", center dot is the user, and the small spark on the upper-right
 * is the Coach's nudge. Brand-yellow when filled, currentColor otherwise.
 *
 * Designed to feel like a thoughtful guide, not a chatbot. Replaces the
 * generic lucide Sparkles in Coach surfaces.
 */
export function CoachIcon({ className, ...props }: CoachIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-5', className)}
      aria-hidden
      {...props}
    >
      {/* Outer "context" ring */}
      <circle cx="11" cy="13" r="7.5" />
      {/* Compass diamond marking direction (N/E/S/W tick) */}
      <path d="M11 8.5 L12.5 13 L11 17.5 L9.5 13 Z" />
      {/* Center "you are here" dot */}
      <circle cx="11" cy="13" r="0.9" fill="currentColor" stroke="none" />
      {/* Coach spark — small north-star at the top-right */}
      <path d="M19 5 L19 8 M17.5 6.5 L20.5 6.5" />
      <circle cx="19" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
