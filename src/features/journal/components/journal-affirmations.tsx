'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

const AFFIRMATIONS = [
  'Relax and write.',
  'Untangle a thought.',
  'Nothing leaves here.',
  'A sentence is enough.',
  'Today doesn’t have to be tidy.',
  'Write the noisy version first.',
] as const

/**
 * Slow rotation of short affirmations under the Journal page header.
 * Crossfade every ~5s. Lives inline so it doesn't fight the page header
 * for vertical space.
 */
export function JournalAffirmations() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let cancelled = false
    // Slower, calmer cadence: long visible dwell, gentle 800ms fade
    // between affirmations so the eye registers each one before it
    // changes.
    const tick = () => {
      setVisible(false)
      setTimeout(() => {
        if (cancelled) return
        setIndex((i) => (i + 1) % AFFIRMATIONS.length)
        setVisible(true)
      }, 800)
    }
    const interval = setInterval(tick, 8000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <span
      key={index}
      className={cn(
        'inline-block transition-opacity duration-700 ease-in-out',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      aria-live="polite"
    >
      {AFFIRMATIONS[index]}
    </span>
  )
}
