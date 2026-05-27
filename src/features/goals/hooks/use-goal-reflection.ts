'use client'

import { useCallback, useEffect, useState } from 'react'

export interface GoalReflection {
  goalId: string
  weekKey: string
  feel: number
  worked: string
  blocked: string
  nextWeekFocus: string
  submittedAt: string
}

function getISOWeekKey(d: Date = new Date()): string {
  // ISO week number per https://en.wikipedia.org/wiki/ISO_week_date
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function storageKey(goalId: string, weekKey: string) {
  return `goalslot:coach:reflection:${goalId}:${weekKey}`
}

export function useGoalReflection(goalId: string | null | undefined) {
  const [weekKey, setWeekKey] = useState<string>('')
  const [lastReflection, setLastReflection] = useState<GoalReflection | null>(null)

  useEffect(() => {
    if (!goalId) {
      setLastReflection(null)
      return
    }
    const wk = getISOWeekKey()
    setWeekKey(wk)
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(storageKey(goalId, wk))
      setLastReflection(raw ? (JSON.parse(raw) as GoalReflection) : null)
    } catch {
      setLastReflection(null)
    }
  }, [goalId])

  const submit = useCallback(
    (payload: Pick<GoalReflection, 'feel' | 'worked' | 'blocked' | 'nextWeekFocus'>) => {
      if (!goalId || !weekKey) return null
      const next: GoalReflection = {
        ...payload,
        goalId,
        weekKey,
        submittedAt: new Date().toISOString(),
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey(goalId, weekKey), JSON.stringify(next))
      }
      setLastReflection(next)
      return next
    },
    [goalId, weekKey],
  )

  return {
    weekKey,
    lastReflection,
    submit,
  }
}

export { getISOWeekKey }
