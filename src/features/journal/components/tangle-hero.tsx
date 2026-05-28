'use client'

import { cn } from '@/lib/utils'

interface TangleHeroProps {
  className?: string
}

/**
 * Decorative SVG line that genuinely morphs — every control point
 * moves smoothly from its tangled position to its calm position and
 * back. Both `d` strings use the SAME command sequence (one `M`, one
 * `C`, then five `S` shortcuts) so SVG's path interpolation creates
 * a continuous deformation instead of swapping between two unrelated
 * shapes. 6s loop, in-out cubic easing for a relaxed breath.
 */
export function TangleHero({ className }: TangleHeroProps) {
  // Same six anchor points along the horizontal axis: 4, 50, 96, 142, 188, 234.
  // The tangled variant pushes alternating control points up/down by
  // big swings; the calm variant keeps them gently above/below the
  // mid-line. The path topology stays identical, so the morph is
  // smooth point-by-point.
  const TANGLED =
    'M4 22 C 20 4, 32 40, 50 22 S 80 4, 96 22 S 126 40, 142 22 S 172 4, 188 22 S 218 40, 234 22'
  const CALM =
    'M4 22 C 20 18, 32 26, 50 22 S 80 18, 96 22 S 126 26, 142 22 S 172 18, 188 22 S 218 26, 234 22'

  return (
    <svg
      viewBox="0 0 238 44"
      className={cn('h-5 w-40', className)}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="#f2cc0d"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="d"
          values={`${TANGLED};${CALM};${TANGLED}`}
          keyTimes="0;0.5;1"
          dur="6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
        />
      </path>
    </svg>
  )
}
