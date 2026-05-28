'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

interface JournalLampProps {
  on: boolean
  onToggle: () => void
}

/**
 * Interactive desk lamp tucked into the top-right of the Journal page.
 * Click the bulb to toggle on/off — controls the ambient glow on the
 * page. When off, the lamp has a gentle idle bob + a soft pulse on the
 * pull-string so it nudges the user to pick it. When on, the bulb glows
 * brand-yellow and the cone of light is visible.
 */
export function JournalLamp({ on, onToggle }: JournalLampProps) {
  // Stop the idle bob once the user has interacted at least once — no
  // need to keep nudging if they already know it's clickable.
  const [hasInteracted, setHasInteracted] = useState(false)
  useEffect(() => {
    if (on) setHasInteracted(true)
  }, [on])

  const handle = () => {
    setHasInteracted(true)
    onToggle()
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={on}
      title={on ? 'Turn lamp off' : 'Turn lamp on'}
      className={cn(
        'group pointer-events-auto relative inline-flex h-32 w-24 items-start justify-center focus-visible:outline-none',
        !hasInteracted && 'motion-safe:animate-[lamp-bob_3.4s_ease-in-out_infinite]',
      )}
    >
      <svg viewBox="0 0 96 128" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="lamp-bulb-on" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="#fff5b3" />
            <stop offset="45%" stopColor="#f2cc0d" />
            <stop offset="100%" stopColor="#a88a08" />
          </radialGradient>
          <linearGradient id="lamp-cone-fill" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fff3a8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fff3a8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Cord from top */}
        <line x1="48" y1="0" x2="48" y2="22" stroke="#52525b" strokeWidth="1.5" />

        {/* Shade (trapezoid) */}
        <path
          d="M28 22 L68 22 L60 56 L36 56 Z"
          fill="#18181b"
          stroke="#27272a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Shade highlight */}
        <path d="M30 24 L36 24 L34 30 L30 30 Z" fill="#3f3f46" opacity="0.6" />

        {/* Bulb socket */}
        <rect x="40" y="56" width="16" height="4" fill="#3f3f46" />

        {/* Bulb */}
        <circle
          cx="48"
          cy="68"
          r="9"
          fill={on ? 'url(#lamp-bulb-on)' : '#3f3f46'}
          stroke={on ? '#a88a08' : '#52525b'}
          strokeWidth="1.25"
        />

        {/* Light cone — only when on */}
        {on && (
          <path
            d="M30 60 L66 60 L92 128 L4 128 Z"
            fill="url(#lamp-cone-fill)"
            opacity="0.85"
          />
        )}

        {/* Pull string + bead. Bead pulses when the lamp is OFF and the
            user hasn't interacted yet, to draw the click. */}
        <line x1="58" y1="60" x2="58" y2="78" stroke="#71717a" strokeWidth="1" />
        <circle
          cx="58"
          cy="80"
          r="2.2"
          fill={on ? '#f2cc0d' : '#a1a1aa'}
          className={cn(
            !on && !hasInteracted && 'motion-safe:animate-[lamp-bead-pulse_1.8s_ease-in-out_infinite]',
          )}
        />
      </svg>

      {/* Bulb glow halo (CSS, sits behind the SVG for blur) */}
      {on && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[42%] -z-10 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f2cc0d]/30 blur-2xl"
        />
      )}
    </button>
  )
}
