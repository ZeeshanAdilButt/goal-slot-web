'use client'

import { cn } from '@/lib/utils'

interface TangleHeroProps {
  className?: string
}

/**
 * Decorative SVG line that morphs from a tangled knot into a clean
 * untangled wave and back, on a 3s loop. Slightly thicker stroke than
 * the original so it actually reads as a stroke at 14–18px height.
 * Pure SVG, animates the `d` attribute via SMIL so we don't drag in
 * a JS animation library for one shape.
 */
export function TangleHero({ className }: TangleHeroProps) {
  // Tangled: messy zigzag with self-crossings — taller amplitude so
  // the transformation to the calm wave reads clearly.
  const TANGLED =
    'M4 22 C 20 4, 28 38, 46 6 S 70 36, 88 8 S 116 36, 138 10 S 162 38, 184 18 S 208 4, 232 22'
  // Calm: a gentle low-amplitude sine across the width.
  const CALM =
    'M4 22 C 30 14, 60 30, 90 22 S 150 14, 184 22 S 220 30, 232 22'

  return (
    <svg
      viewBox="0 0 236 44"
      className={cn('h-5 w-40', className)}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="#f2cc0d"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      >
        <animate
          attributeName="d"
          values={`${TANGLED};${CALM};${CALM};${TANGLED};${TANGLED}`}
          keyTimes="0;0.45;0.7;0.95;1"
          dur="16s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.25 0.1 0.25 1;0 0 1 1;0.25 0.1 0.25 1;0 0 1 1"
        />
        <animate
          attributeName="opacity"
          values="0.6;1;1;0.6;0.6"
          keyTimes="0;0.45;0.7;0.95;1"
          dur="16s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.25 0.1 0.25 1;0 0 1 1;0.25 0.1 0.25 1;0 0 1 1"
        />
      </path>
    </svg>
  )
}
