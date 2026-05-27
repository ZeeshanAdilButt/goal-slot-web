'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type RecommendationKind = 'INTERVENTION' | 'FRICTION_BLOCK'

export interface CoachRecommendation {
  id: string
  kind: RecommendationKind
  title: string
  body: string
}

export interface CoachNarrativeData {
  narrative: string
  recommendations: CoachRecommendation[]
}

interface PersistedNarrative extends CoachNarrativeData {
  dismissedIds: string[]
}

const STORAGE_PREFIX = 'goalslot:coach:narrative:'

function storageKey(periodKey: string) {
  return `${STORAGE_PREFIX}${periodKey}`
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function synthesize(periodKey: string): CoachNarrativeData {
  // Hardcoded plausible template — varies subtly by period key hash.
  const seed = periodKey.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 3
  const narratives = [
    `This week tracked 18 hours of focused work — your highest in a month, but ${seed === 0 ? 'concentrated heavily on Monday and Tuesday' : 'distributed unevenly with a Wednesday slump'}. Mood and energy trended down mid-week despite strong output, and your check-ins flagged "context switching" twice. The pattern suggests you are pushing through friction rather than removing it. What would change if you protected one block on Wednesday for the work that drained you?`,
    `Across the period you logged 14.5 hours on Goal "Ship v2" — close to target — but every session shorter than 45 minutes correlated with a mood drop the next day. The longest sessions were also the most satisfying. Your environment notes mentioned phone interruptions twice. Where is the smallest friction you could remove this week to make 60-minute blocks the default?`,
    `Your top goal received 22 hours, double the next. That focus is paying off in momentum, but your journal mentioned "burned out" on day 5 and "skipped workout" three times. Output is durable only as long as the body holds up. What boundary, if you held it, would let you keep this pace for another month?`,
  ]
  const recs: CoachRecommendation[][] = [
    [
      {
        id: makeId('rec'),
        kind: 'INTERVENTION',
        title: 'Protect a Wednesday focus block',
        body: 'Schedule a 90-minute block on Wednesday morning before any meetings. Treat it like a dentist appointment.',
      },
      {
        id: makeId('rec'),
        kind: 'FRICTION_BLOCK',
        title: 'Silence notifications during deep work',
        body: 'Your phone is the #1 interruption source. Set it to "Do Not Disturb" during scheduled blocks.',
      },
    ],
    [
      {
        id: makeId('rec'),
        kind: 'INTERVENTION',
        title: 'Default to 60-minute blocks',
        body: 'Sessions under 45 minutes are net-negative for your mood. Cap your calendar so nothing shorter slips in.',
      },
      {
        id: makeId('rec'),
        kind: 'FRICTION_BLOCK',
        title: 'Move phone out of the room',
        body: 'Physical distance from your phone correlates with longer sessions in your journal. Try it for one week.',
      },
      {
        id: makeId('rec'),
        kind: 'INTERVENTION',
        title: 'Pre-commit tomorrow night',
        body: 'Decide the next day’s top 3 before you close the laptop. You spend the first 20 minutes choosing otherwise.',
      },
    ],
    [
      {
        id: makeId('rec'),
        kind: 'FRICTION_BLOCK',
        title: 'Reinstate the morning workout',
        body: 'Three skipped workouts this week. Your check-in mood is consistently higher on workout days.',
      },
      {
        id: makeId('rec'),
        kind: 'INTERVENTION',
        title: 'Cap deep-work days at 5',
        body: 'You can sprint at this pace for a week. You cannot for a month. Pick one weekday for recovery work.',
      },
    ],
  ]
  return { narrative: narratives[seed], recommendations: recs[seed] }
}

function readCache(periodKey: string): PersistedNarrative | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(periodKey))
    if (!raw) return null
    return JSON.parse(raw) as PersistedNarrative
  } catch {
    return null
  }
}

function writeCache(periodKey: string, data: PersistedNarrative) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(periodKey), JSON.stringify(data))
}

export function useCoachNarrative(periodKey: string) {
  const [status, setStatus] = useState<'streaming' | 'done'>('streaming')
  const [revealed, setRevealed] = useState(0)
  const [data, setData] = useState<CoachNarrativeData | null>(null)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  // Load or synthesize on period change
  useEffect(() => {
    if (!periodKey) return
    const cached = readCache(periodKey)
    if (cached) {
      setData({ narrative: cached.narrative, recommendations: cached.recommendations })
      setDismissedIds(cached.dismissedIds ?? [])
      setRevealed(cached.narrative.length) // already-seen narratives skip the streaming animation
      setStatus('done')
    } else {
      const fresh = synthesize(periodKey)
      setData(fresh)
      setDismissedIds([])
      setRevealed(0)
      setStatus('streaming')
      writeCache(periodKey, { ...fresh, dismissedIds: [] })
    }
  }, [periodKey])

  // Char-by-char stream (~10ms per char) for fresh narratives
  useEffect(() => {
    if (!data || status !== 'streaming') return
    if (revealed >= data.narrative.length) {
      setStatus('done')
      return
    }
    const t = setTimeout(() => setRevealed((r) => r + 1), 10)
    return () => clearTimeout(t)
  }, [revealed, data, status])

  const dismiss = useCallback(
    (id: string) => {
      setDismissedIds((prev) => {
        if (prev.includes(id)) return prev
        const next = [...prev, id]
        if (data) {
          writeCache(periodKey, { ...data, dismissedIds: next })
        }
        return next
      })
    },
    [data, periodKey],
  )

  const visibleNarrative = data ? data.narrative.slice(0, revealed) : ''
  const recommendations = useMemo(
    () => (data ? data.recommendations.filter((r) => !dismissedIds.includes(r.id)) : []),
    [data, dismissedIds],
  )

  return {
    narrative: visibleNarrative,
    status,
    recommendations,
    dismiss,
  }
}
