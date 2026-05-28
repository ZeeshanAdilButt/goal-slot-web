import * as React from 'react'

import { cn } from '@/lib/utils'

type SvgProps = React.SVGProps<SVGSVGElement> & { className?: string }

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/**
 * Custom face-with-smile mark for Mood. Stylised so the surface reads as
 * GoalSlot, not a stock lucide Smile/Frown swap.
 */
export function MoodGlyphIcon({ className, ...rest }: SvgProps) {
  return (
    <svg {...baseProps} className={cn('h-4 w-4', className)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8 14.5c1.1 1.5 2.5 2.2 4 2.2s2.9-.7 4-2.2" />
    </svg>
  )
}

/**
 * Custom bolt-in-disc mark for Energy. Sharper than the lucide Zap, with a
 * subtle outer ring so it visually rhymes with Mood + Focus glyphs.
 */
export function EnergyGlyphIcon({ className, ...rest }: SvgProps) {
  return (
    <svg {...baseProps} className={cn('h-4 w-4', className)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M13.4 5.5 8.5 12.8h3.6L10.6 18.5l4.9-7.3H12l1.4-5.7z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Custom bullseye mark for Focus. Three rings + centre dot — a clean,
 * non-AI take on the lucide Target.
 */
export function FocusGlyphIcon({ className, ...rest }: SvgProps) {
  return (
    <svg {...baseProps} className={cn('h-4 w-4', className)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}
