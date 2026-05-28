import * as React from 'react'

import { cn } from '@/lib/utils'

interface GoalFlagIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Custom Goal Flag icon — a pole with a wedge flag and a small base,
 * reading like a summit marker. Used in the Focus Now strip and other
 * "this is linked to a goal" cues. More aspirational than the generic
 * lucide Target crosshair.
 */
export function GoalFlagIcon({ className, ...props }: GoalFlagIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
      aria-hidden
      {...props}
    >
      {/* Pole */}
      <path d="M6 21 V4" />
      {/* Filled wedge flag */}
      <path d="M6 4 H17 L13.5 8 L17 12 H6 Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
      {/* Base / ground line */}
      <path d="M4 21 H10" />
    </svg>
  )
}
