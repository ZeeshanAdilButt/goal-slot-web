'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Bottom-left "did you know" tips strip. Surfaces one tip at a time, on a
 * lazy schedule (first one ~25s after mount, then every ~3 minutes while
 * the tab is visible), slides in from the left, auto-dismisses after
 * 12 seconds. Anchored bottom-left so it stays clear of the bottom-right
 * floating Coach button.
 *
 * Persistence:
 *   - per-tip "seen" set in localStorage so we don't repeat tips across
 *     reloads (cycles back through once all have been shown)
 *   - "Mute tips" persisted in localStorage; once muted, no more tips
 *     ever surface until the user clears the flag (no exposed UI to
 *     un-mute yet — intentional: this is a "tour" not a permanent toast
 *     channel, and we want users in mute mode to forget about it)
 *
 * Tips can carry an optional href so a tip about a feature can route the
 * user straight to it on click.
 */

type Tip = {
  id: string
  emoji: string
  text: React.ReactNode
  href?: string
}

const TIPS: Tip[] = [
  {
    id: 'cmd-k',
    emoji: '⌘',
    text: (
      <>
        Press <Kbd>Ctrl</Kbd> / <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to jump to any page,
        goal, or task — Notion-style.
      </>
    ),
  },
  {
    id: 'coach-context',
    emoji: '🧭',
    text: (
      <>
        The Coach reads your check-ins, schedule, and goals. Ask it what to
        focus on this week.
      </>
    ),
    href: '/dashboard/coach',
  },
  {
    id: 'journal-night',
    emoji: '🌙',
    text: (
      <>
        Open the Journal after dark — the sun becomes a moon and the lamp
        lights up.
      </>
    ),
    href: '/dashboard/journal',
  },
  {
    id: 'notes-multiselect',
    emoji: '🗂️',
    text: (
      <>
        Hold <Kbd>Ctrl</Kbd> / <Kbd>⌘</Kbd> + click in Notes to select
        several at once.
      </>
    ),
    href: '/dashboard/notes',
  },
  {
    id: 'notes-nest',
    emoji: '🪺',
    text: (
      <>
        Drag a note onto another to make it a sub-note. Drag back out to
        promote.
      </>
    ),
    href: '/dashboard/notes',
  },
  {
    id: 'checkin-teaser',
    emoji: '🌤️',
    text: (
      <>
        The 🌤️ in the top-right is your 30-second daily check-in. The
        Coach reads it.
      </>
    ),
  },
  {
    id: 'quick-start',
    emoji: '⏱️',
    text: (
      <>
        Start tracking from any page — click Start tracking in the top
        bar, or hit <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd> → “Start tracking”.
      </>
    ),
  },
  {
    id: 'focus-now',
    emoji: '🟡',
    text: (
      <>
        The yellow strip up top is your active schedule block. Click “Up
        next” to peek at what's coming.
      </>
    ),
    href: '/dashboard/schedule',
  },
  {
    id: 'coach-edit',
    emoji: '✏️',
    text: (
      <>
        Edit any of your messages to the Coach to re-ask — the reply that
        came after gets replaced cleanly.
      </>
    ),
    href: '/dashboard/coach',
  },
  {
    id: 'goals-color',
    emoji: '🏳️',
    text: (
      <>
        Goal colors carry through to the schedule and tasks — pick
        colors you'll recognise at a glance.
      </>
    ),
    href: '/dashboard/goals',
  },
]

const STORAGE_SEEN = 'goalslot.tips.seen.v1'
const STORAGE_MUTED = 'goalslot.tips.muted.v1'
const FIRST_DELAY_MS = 25_000
const INTERVAL_MS = 180_000 // 3 minutes between tips
const AUTO_DISMISS_MS = 12_000

function readSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_SEEN)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

function writeSeen(seen: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_SEEN, JSON.stringify([...seen]))
  } catch {
    /* localStorage full / disabled — fine, tips just won't persist */
  }
}

function isMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_MUTED) === '1'
  } catch {
    return false
  }
}

function setMuted() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_MUTED, '1')
  } catch {
    /* noop */
  }
}

function pickNextTip(seen: Set<string>): Tip | null {
  // Prefer unseen tips. When all have been seen, rotate from the start so
  // the user still gets occasional reminders without it feeling random.
  const unseen = TIPS.filter((t) => !seen.has(t.id))
  if (unseen.length > 0) return unseen[Math.floor(Math.random() * unseen.length)]
  if (TIPS.length === 0) return null
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

export function TipsCorner() {
  const [current, setCurrent] = useState<Tip | null>(null)
  const seenRef = useRef<Set<string>>(new Set())
  const intervalRef = useRef<number | null>(null)
  const autoDismissRef = useRef<number | null>(null)
  const mutedRef = useRef(false)

  const clearAutoDismiss = useCallback(() => {
    if (autoDismissRef.current) {
      window.clearTimeout(autoDismissRef.current)
      autoDismissRef.current = null
    }
  }, [])

  const surface = useCallback(() => {
    if (mutedRef.current) return
    if (document.hidden) return
    const next = pickNextTip(seenRef.current)
    if (!next) return
    setCurrent(next)
    clearAutoDismiss()
    autoDismissRef.current = window.setTimeout(() => {
      setCurrent(null)
    }, AUTO_DISMISS_MS)
  }, [clearAutoDismiss])

  // Mark the visible tip as seen when it leaves the screen — counts both
  // auto-dismiss and explicit close.
  const handleDismiss = useCallback(() => {
    setCurrent((cur) => {
      if (cur) {
        seenRef.current.add(cur.id)
        writeSeen(seenRef.current)
      }
      return null
    })
    clearAutoDismiss()
  }, [clearAutoDismiss])

  const handleMute = useCallback(() => {
    mutedRef.current = true
    setMuted()
    setCurrent(null)
    clearAutoDismiss()
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [clearAutoDismiss])

  useEffect(() => {
    seenRef.current = readSeen()
    mutedRef.current = isMuted()
    if (mutedRef.current) return

    const firstTimer = window.setTimeout(() => {
      surface()
      intervalRef.current = window.setInterval(surface, INTERVAL_MS)
    }, FIRST_DELAY_MS)

    return () => {
      window.clearTimeout(firstTimer)
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      clearAutoDismiss()
    }
  }, [surface, clearAutoDismiss])

  // Persist seen whenever current changes from a tip to null (we mark
  // as seen in handleDismiss already, but auto-dismiss after the tip's
  // own timer also flows through setCurrent(null) — keep them in sync.)
  useEffect(() => {
    if (current) {
      seenRef.current.add(current.id)
      writeSeen(seenRef.current)
    }
  }, [current])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-30 sm:bottom-6 sm:left-6"
    >
      <AnimatePresence mode="popLayout">
        {current && <TipPill key={current.id} tip={current} onDismiss={handleDismiss} onMute={handleMute} />}
      </AnimatePresence>
    </div>
  )
}

function TipPill({
  tip,
  onDismiss,
  onMute,
}: {
  tip: Tip
  onDismiss: () => void
  onMute: () => void
}) {
  const body = (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <span aria-hidden className="mt-px text-[15px] leading-none opacity-90">
        {tip.emoji}
      </span>
      <div className="min-w-0 flex-1 text-[12.5px] leading-[1.45] text-zinc-700">
        {tip.text}
        {tip.href && (
          <span className="ml-1 text-[11px] text-zinc-400">→</span>
        )}
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -12, opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group/tip pointer-events-auto relative"
    >
      <div className="relative overflow-hidden rounded-lg border border-zinc-200/80 bg-white/85 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.18)] backdrop-blur-md max-w-[min(22rem,calc(100vw-2rem))]">
        {/* Subtle left accent so the eye finds the tip without it
            being shouty — same hue as the brand yellow but at low
            saturation so it reads as a quiet whisper, not a banner. */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-[#f2cc0d]/0 via-[#f2cc0d]/40 to-[#f2cc0d]/0"
        />

        {tip.href ? (
          <Link
            href={tip.href}
            onClick={onDismiss}
            className="block transition-colors hover:bg-zinc-50/70"
          >
            {body}
          </Link>
        ) : (
          body
        )}

        {/* Close button only shows on hover so the resting state is
            uncluttered. Mute is buried in a tooltip-style title attr
            on a second tiny icon — keeps the surface tiny. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onDismiss()
          }}
          aria-label="Dismiss tip"
          className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded text-zinc-300 opacity-0 transition-all hover:bg-zinc-100 hover:text-zinc-600 group-hover/tip:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onMute()
          }}
          title="Stop showing tips"
          aria-label="Stop showing tips"
          className="absolute bottom-1 right-1.5 text-[9px] font-medium text-zinc-300 opacity-0 transition-opacity hover:text-zinc-500 group-hover/tip:opacity-100"
        >
          mute
        </button>
      </div>
    </motion.div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[15px] items-center rounded border border-zinc-200 bg-zinc-50 px-[3px] font-mono text-[10px] text-zinc-600">
      {children}
    </kbd>
  )
}
