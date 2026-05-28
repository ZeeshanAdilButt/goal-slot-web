'use client'

import { cn } from '@/lib/utils'

interface TangleHeroProps {
  className?: string
}

/**
 * "A tangled thought becomes a clear line." Wide, dramatic morph: the
 * TANGLED path uses extreme control points that pull the cubic bezier
 * segments into overlapping loops — visually it reads as a knotted
 * string crossing over itself. The CALM path keeps every anchor on
 * the midline so the string genuinely straightens to a flat horizontal
 * stroke. Both paths share the exact same command sequence (M + six
 * S shortcuts), so SVG path interpolation morphs every control point
 * smoothly from its tangled position to the flat position and back.
 */
export function TangleHero({ className }: TangleHeroProps) {
  // Seven X anchors at 16 / 76 / 136 / 196 / 256 / 316 / 376.
  // TANGLED uses control points that swing 60+ above/below the
  // midline AND pull BACKWARD (negative x relative to expected) so
  // each cubic segment forms a near-closed loop where the stroke
  // crosses over itself. Looks like a string knotted in multiple
  // places.
  const TANGLED =
    'M16 60 C 80 -20, -10 130, 76 60 S 200 -10, 136 60 S 50 140, 196 60 S 320 -20, 256 60 S 180 140, 316 60 S 440 -10, 376 60'
  // CALM: every control point sits on the midline so the path
  // straightens to a single horizontal stroke.
  const CALM =
    'M16 60 C 36 60, 56 60, 76 60 S 116 60, 136 60 S 176 60, 196 60 S 236 60, 256 60 S 296 60, 316 60 S 356 60, 376 60'

  return (
    <svg
      viewBox="0 0 392 120"
      className={cn('h-16 w-80', className)}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="#f2cc0d"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="d"
          values={`${TANGLED};${CALM};${TANGLED}`}
          keyTimes="0;0.5;1"
          dur="9s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
        />
      </path>
    </svg>
  )
}
