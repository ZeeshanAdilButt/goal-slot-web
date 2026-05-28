'use client'

import { cn } from '@/lib/utils'

interface TangleHeroProps {
  className?: string
}

/**
 * "A tangled thought becomes a clear line." The TANGLED path is six
 * explicit cubic bezier segments where each pair of control points
 * sits far above (y=-10) and far below (y=190) the midline (y=90)
 * — that combination pulls each segment into a near-circular loop
 * where the stroke crosses over itself. Visually it reads as a
 * string knotted in six places, not a zig-zag.
 *
 * The CALM path uses the same six cubic segments but every control
 * point sits on the midline, so each `C` collapses to a straight
 * segment. Identical command structure means SVG path interpolation
 * smoothly morphs every control point between the two states.
 */
export function TangleHero({ className }: TangleHeroProps) {
  // Seven anchors at y=90; each pair forms a loop with controls at
  // y=-10 and y=190. Anchors at x=30 / 90 / 140 / 190 / 240 / 290 / 340.
  const TANGLED =
    'M 30 90 ' +
    'C 130 -10, -30 190, 90 90 ' +
    'C 180 -10, 20 190, 140 90 ' +
    'C 230 -10, 70 190, 190 90 ' +
    'C 280 -10, 120 190, 240 90 ' +
    'C 330 -10, 170 190, 290 90 ' +
    'C 380 -10, 220 190, 340 90'
  // CALM: every control point on the midline, so each cubic segment
  // collapses to a straight horizontal stroke.
  const CALM =
    'M 30 90 ' +
    'C 60 90, 60 90, 90 90 ' +
    'C 110 90, 110 90, 140 90 ' +
    'C 160 90, 160 90, 190 90 ' +
    'C 210 90, 210 90, 240 90 ' +
    'C 260 90, 260 90, 290 90 ' +
    'C 310 90, 310 90, 340 90'

  return (
    <svg
      viewBox="0 0 370 180"
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
