import * as React from 'react'

import { cn } from '@/lib/utils'

interface FeatherPenIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Custom feather-pen mark for the quick-journal floating action button.
 * Stylised quill: curved nib bottom-left, tapered shaft, a few barb hints
 * along the upper edge. Single-colour (currentColor) so the parent can
 * tint with brand-yellow or zinc.
 */
export function FeatherPenIcon({ className, ...rest }: FeatherPenIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-5 w-5', className)}
      {...rest}
    >
      {/* Shaft: curves from top-right down to nib bottom-left */}
      <path d="M20.5 3.5C16 4 11.8 6.3 8.6 9.6 5.7 12.6 3.9 16.3 3.5 20.5" />
      {/* Nib tip + ink dot */}
      <path d="M3.5 20.5l3.6-1.1" />
      <circle cx="3.5" cy="20.5" r="0.6" fill="currentColor" stroke="none" />
      {/* Vane / barb hints along the upper edge of the shaft */}
      <path d="M16 4.6c-2 .6-3.7 1.7-5.2 3.2" />
      <path d="M13.3 6.4c-1.7.7-3.1 1.8-4.3 3.2" />
      <path d="M10.7 8.6c-1.5.8-2.7 2-3.7 3.4" />
      <path d="M8.5 11c-1.3.9-2.3 2.1-3 3.5" />
    </svg>
  )
}
