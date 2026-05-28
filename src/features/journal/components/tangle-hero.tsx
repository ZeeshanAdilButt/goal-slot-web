'use client'

import { cn } from '@/lib/utils'

interface TangleHeroProps {
  className?: string
}

/**
 * Decorative SVG line that morphs from a tangled knot into a clean
 * untangled loop and back, on a slow loop. Sits at the top of the
 * Journal page as a tiny visual metaphor for what writing here does
 * to a busy head. Pure SVG, animates the `d` attribute via SMIL
 * <animate> so we don't drag in a JS animation library for one shape.
 */
export function TangleHero({ className }: TangleHeroProps) {
  // Two paths to morph between.
  // Tangled: messy zigzag with self-crossings.
  const TANGLED =
    'M4 14 C 18 4, 22 24, 36 8 S 52 22, 66 6 S 90 24, 110 12 S 136 2, 150 18 S 168 4, 184 14'
  // Calm: gentle sine wave from left to right.
  const CALM =
    'M4 14 C 24 14, 36 14, 56 14 S 96 14, 116 14 S 156 14, 184 14'

  return (
    <svg
      viewBox="0 0 188 28"
      className={cn('h-3 w-32', className)}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="#f2cc0d"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      >
        <animate
          attributeName="d"
          values={`${TANGLED};${CALM};${CALM};${TANGLED}`}
          keyTimes="0;0.45;0.65;1"
          dur="6.5s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1;0 0 1 1;0.42 0 0.58 1"
        />
      </path>
    </svg>
  )
}
