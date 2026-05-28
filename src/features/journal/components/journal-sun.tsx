'use client'

import { cn } from '@/lib/utils'

interface JournalSunProps {
  className?: string
}

/**
 * Daytime sun decoration for the Journal page. Visible when the lamp
 * is off (= day mode). Slowly rotates its rays so it feels alive
 * without competing with the writing surface for attention.
 */
export function JournalSun({ className }: JournalSunProps) {
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none relative inline-block h-32 w-32', className)}
    >
      <svg viewBox="0 0 128 128" className="h-full w-full">
        <defs>
          <radialGradient id="journal-sun-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff5b3" />
            <stop offset="55%" stopColor="#f2cc0d" />
            <stop offset="100%" stopColor="#d9b307" />
          </radialGradient>
          <radialGradient id="journal-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3a8" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#f2cc0d" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f2cc0d" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Soft halo */}
        <circle cx="64" cy="64" r="60" fill="url(#journal-sun-glow)" />
        {/* Rays — slowly rotate around the sun's center */}
        <g
          className="motion-safe:[animation:sun-rotate_60s_linear_infinite] origin-center"
          style={{ transformOrigin: '64px 64px' }}
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12
            return (
              <line
                key={i}
                x1="64"
                y1="20"
                x2="64"
                y2="30"
                stroke="#f2cc0d"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${angle} 64 64)`}
                opacity={i % 2 === 0 ? 0.9 : 0.55}
              />
            )
          })}
        </g>
        {/* Sun body */}
        <circle cx="64" cy="64" r="18" fill="url(#journal-sun-core)" stroke="#a88a08" strokeWidth="1.25" />
      </svg>
    </span>
  )
}
