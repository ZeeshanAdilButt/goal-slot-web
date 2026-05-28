import * as React from 'react'

import { cn } from '@/lib/utils'

interface NotebookIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Custom spiral-bound notebook mark for the Notes nav item. Spiral
 * loops along the left edge, a folded corner bottom-right, and two
 * faint ruling lines suggesting written text. currentColor so the
 * sidebar can tint it on active.
 */
export function NotebookIcon({ className, ...rest }: NotebookIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-4 w-4', className)}
      {...rest}
    >
      {/* Cover with folded bottom-right corner */}
      <path d="M6 3 H17.5 a1.5 1.5 0 0 1 1.5 1.5 V18 L15 21 H7.5 A1.5 1.5 0 0 1 6 19.5 Z" />
      {/* Folded corner crease */}
      <path d="M19 18 L15 18 L15 21" />
      {/* Spiral binding holes along the left edge */}
      <circle cx="6" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="10" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="13.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="17" r="0.6" fill="currentColor" stroke="none" />
      {/* Spiral rings — small arcs hooking through the holes */}
      <path d="M5 6.5 a1 1 0 0 0 0 0" />
      <path d="M5.2 6 q-1 .5 0 1" />
      <path d="M5.2 9.5 q-1 .5 0 1" />
      <path d="M5.2 13 q-1 .5 0 1" />
      <path d="M5.2 16.5 q-1 .5 0 1" />
      {/* Two faint ruling lines on the page */}
      <path d="M9 9 H16" opacity="0.45" />
      <path d="M9 12.5 H14" opacity="0.45" />
    </svg>
  )
}
