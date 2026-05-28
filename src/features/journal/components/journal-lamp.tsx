'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

interface JournalLampProps {
  on: boolean
  onToggle: () => void
}

/**
 * Interactive bedside-style lamp. Cylindrical base, fabric dome shade,
 * thin neck, pull-string with a small bead. Click anywhere on the lamp
 * to toggle the bulb (which controls the page's ambient glow). While
 * off + before first interaction the lamp does a gentle bob and the
 * pull-string bead softly pulses, so the user notices the click target.
 */
export function JournalLamp({ on, onToggle }: JournalLampProps) {
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
        'group pointer-events-auto relative inline-flex h-40 w-32 items-end justify-center focus-visible:outline-none',
        !hasInteracted && 'motion-safe:animate-[lamp-bob_3.4s_ease-in-out_infinite]',
      )}
    >
      <svg viewBox="0 0 96 128" className="h-full w-full" aria-hidden="true">
        <defs>
          {/* Warm bulb gradient — only used when on */}
          <radialGradient id="bedside-bulb-on" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8c2" />
            <stop offset="60%" stopColor="#f2cc0d" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f2cc0d" stopOpacity="0" />
          </radialGradient>
          {/* Fabric shade fill — warmer when on */}
          <linearGradient id="bedside-shade-on" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5a4a18" />
            <stop offset="60%" stopColor="#8a7307" />
            <stop offset="100%" stopColor="#f2cc0d" />
          </linearGradient>
          <linearGradient id="bedside-shade-off" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#3f3f46" />
          </linearGradient>
          <linearGradient id="bedside-base" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
          {/* Light cone — only when on */}
          <linearGradient id="bedside-cone" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fff3a8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff3a8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lamp shade — dome / drum shape */}
        <path
          d="M22 18 L74 18 L66 50 L30 50 Z"
          fill={on ? 'url(#bedside-shade-on)' : 'url(#bedside-shade-off)'}
          stroke="#27272a"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        {/* Shade rim highlight */}
        <path d="M22 18 L74 18" stroke="#52525b" strokeWidth="1.25" />
        <path d="M30 50 L66 50" stroke="#0a0a0a" strokeWidth="1.25" />

        {/* Neck (thin rod from shade down to base) */}
        <rect x="46" y="50" width="4" height="44" fill="#52525b" />

        {/* Base — round disc with subtle highlight */}
        <ellipse cx="48" cy="100" rx="22" ry="6" fill="url(#bedside-base)" stroke="#0a0a0a" strokeWidth="1" />
        <ellipse cx="48" cy="98" rx="22" ry="5" fill="#27272a" />
        <ellipse cx="48" cy="97" rx="18" ry="3" fill="#3f3f46" opacity="0.7" />

        {/* Bulb glow under the shade — only when on */}
        {on && <circle cx="48" cy="48" r="14" fill="url(#bedside-bulb-on)" />}

        {/* Light cone spilling onto the surface */}
        {on && (
          <path
            d="M30 50 L66 50 L82 110 L14 110 Z"
            fill="url(#bedside-cone)"
            opacity="0.8"
          />
        )}

        {/* Pull-string + bead, hangs from the right side of the shade.
            The bead pulses softly when the lamp is OFF and unclicked. */}
        <line x1="64" y1="50" x2="64" y2="62" stroke="#71717a" strokeWidth="1" />
        <circle
          cx="64"
          cy="64"
          r="2.2"
          fill={on ? '#f2cc0d' : '#a1a1aa'}
          className={cn(
            !on && !hasInteracted && 'motion-safe:animate-[lamp-bead-pulse_1.8s_ease-in-out_infinite]',
          )}
        />
      </svg>

      {/* Soft CSS halo behind the SVG when on — sits behind the shade */}
      {on && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[36%] -z-10 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f2cc0d]/30 blur-2xl"
        />
      )}
    </button>
  )
}
