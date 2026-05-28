'use client'

import { cn } from '@/lib/utils'

interface TangleHeroProps {
  className?: string
}

/**
 * The "tangled thought becomes a straight line" hero animation.
 * Both `d` strings share the SAME command structure (M then six S
 * shortcuts over six anchor X-points) so SVG path interpolation
 * smoothly moves every control point from its tangled position to
 * the flat line and back. Bigger viewBox + amplitude than the
 * previous iteration so the morph reads at journal-page scale.
 */
export function TangleHero({ className }: TangleHeroProps) {
  // Six X anchors at 8 / 60 / 112 / 164 / 216 / 268 / 320.
  // TANGLED swings ±32 from the midline; CALM keeps Y=40 throughout
  // so the line genuinely straightens — a single horizontal stroke.
  const TANGLED =
    'M8 40 C 30 8, 50 72, 60 40 S 90 8, 112 40 S 142 72, 164 40 S 194 8, 216 40 S 246 72, 268 40 S 298 8, 320 40'
  const CALM =
    'M8 40 C 30 40, 50 40, 60 40 S 90 40, 112 40 S 142 40, 164 40 S 194 40, 216 40 S 246 40, 268 40 S 298 40, 320 40'

  return (
    <svg
      viewBox="0 0 328 80"
      className={cn('h-10 w-64', className)}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="#f2cc0d"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="d"
          values={`${TANGLED};${CALM};${TANGLED}`}
          keyTimes="0;0.5;1"
          dur="7s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
        />
      </path>
    </svg>
  )
}
