'use client'

import { useCallback, useEffect, useState } from 'react'

export interface DailyCheckin {
  date: string
  mood: number
  energy: number
  focus: number
  blocked: string
  worked: string
  submittedAt: string
}

function todayKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function storageKey(date: string) {
  return `goalslot:coach:checkin:${date}`
}

function readCheckin(date: string): DailyCheckin | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(date))
    if (!raw) return null
    return JSON.parse(raw) as DailyCheckin
  } catch {
    return null
  }
}

export function useDailyCheckin() {
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null)
  const [date, setDate] = useState<string>('')

  useEffect(() => {
    const d = todayKey()
    setDate(d)
    setTodayCheckin(readCheckin(d))
  }, [])

  const submit = useCallback(
    (payload: Omit<DailyCheckin, 'date' | 'submittedAt'>) => {
      if (!date) return
      const next: DailyCheckin = {
        ...payload,
        date,
        submittedAt: new Date().toISOString(),
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey(date), JSON.stringify(next))
      }
      setTodayCheckin(next)
      return next
    },
    [date],
  )

  return {
    todayCheckin,
    submit,
  }
}
