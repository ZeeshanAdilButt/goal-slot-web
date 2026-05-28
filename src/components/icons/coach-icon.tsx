import * as React from 'react'

import { cn } from '@/lib/utils'

interface CoachIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Coach icon. Premium two-tone mark: a rounded square frame in
 * currentColor (matches the GoalSlot brand square) with a soft
 * inner compass — a circle "lens" and a single upward needle that
 * reads as "guidance + clarity". Designed to feel like a quiet,
 * confident mentor, not a chatbot Sparkles.
 *
 * Renders crisp at any size from 14px to 64px. Defaults to currentColor
 * so wherever it's used the surrounding color theme controls fill.
 */
export function CoachIcon({ className, ...props }: CoachIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn('h-5 w-5', className)}
      aria-hidden
      {...props}
    >
      {/* Outer rounded-square frame, currentColor stroke */}
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      {/* Inner "lens" — soft tinted disc */}
      <circle
        cx="12"
        cy="13"
        r="4.5"
        fill="currentColor"
        opacity="0.12"
      />
      {/* Compass needle pointing up — solid wedge, currentColor */}
      <path
        d="M12 8 L13.6 13.6 L12 12.2 L10.4 13.6 Z"
        fill="currentColor"
      />
      {/* Center pivot dot */}
      <circle cx="12" cy="13" r="0.9" fill="currentColor" />
    </svg>
  )
}
