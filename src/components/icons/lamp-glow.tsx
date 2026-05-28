import * as React from 'react'

import { cn } from '@/lib/utils'

interface LampGlowProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Ambient "desk lamp" glow used as a background decoration on the Journal
 * page. A soft warm radial glow tucked into a corner — low-contrast, no
 * stroke — meant to be barely-there and just warm the surface. Pair with
 * a reduced opacity utility on the parent (e.g. opacity-60).
 */
export function LampGlow({ className, ...rest }: LampGlowProps) {
  return (
    <svg
      viewBox="0 0 320 320"
      aria-hidden="true"
      className={cn('pointer-events-none', className)}
      {...rest}
    >
      <defs>
        <radialGradient id="lamp-glow-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3a8" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#f2cc0d" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#f2cc0d" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#f2cc0d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lamp-cone" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fff3a8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff3a8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Soft halo */}
      <circle cx="160" cy="160" r="150" fill="url(#lamp-glow-core)" />
      {/* Down-cone hint */}
      <path d="M120 60 L200 60 L260 300 L60 300 Z" fill="url(#lamp-cone)" opacity="0.6" />
    </svg>
  )
}
