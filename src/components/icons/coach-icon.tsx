import * as React from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

interface CoachIconProps {
  className?: string
  /** Override the underlying pixel size. Defaults to 20. */
  size?: number
}

/**
 * Coach icon. Uses the GoalSlot brand square logo so the Coach reads as
 * "GoalSlot's AI" (the brand IS the Coach) rather than a generic chatbot
 * mark. Square aspect, transparent corners, scales crisp at any size.
 *
 * Drop-in replacement for the previous lucide-style stroked SVG so any
 * surface that imports CoachIcon now picks up the brand mark.
 */
export function CoachIcon({ className, size = 20 }: CoachIconProps) {
  return (
    <span
      className={cn('relative inline-block shrink-0 align-middle', className ?? `h-5 w-5`)}
    >
      <Image
        src="/icons/goalslot-icon.svg"
        alt=""
        fill
        sizes={`${size}px`}
        className="object-contain"
        aria-hidden
      />
    </span>
  )
}
