'use client'

import { TimeEntry } from '@/features/time-tracker/utils/types'
import { useQuery } from '@tanstack/react-query'

import { timeEntriesApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

/**
 * Fallback for the per-user daily focus goal, in minutes.
 *
 * This used to be `DAILY_STREAK_GOAL = 30` and was the goal itself, which
 * meant anyone tracking real hours cleared it before breakfast -- the card
 * read "304 / 30 min today" and the bar sat at 100% every day. The goal now
 * lives on the user (`User.dailyFocusGoalMinutes`, API default 240).
 *
 * The constant survives only as a fallback for the window where the browser
 * holds a persisted user object minted before the API shipped that field.
 * It matches the server default so the card reads the same either way.
 */
export const DEFAULT_DAILY_FOCUS_GOAL_MINUTES = 240

const STREAK_LOOKBACK_DAYS = 366

type StreakTimeEntry = TimeEntry & {
  durationMinutes?: number
}

interface FocusStreakResult {
  currentStreak: number
  bestStreak: number
  todayMinutesTracked: number
  dailyGoalMinutes: number
  todayProgressPercent: number
  minutesRemainingToday: number
  showMotivation: boolean
  motivationalMessage?: string
  isPending: boolean
  isError: boolean
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const entryDateKey = (date: string) => date.slice(0, 10)

const entryMinutes = (entry: StreakTimeEntry) => {
  if (typeof entry.durationMinutes === 'number' && Number.isFinite(entry.durationMinutes)) {
    return entry.durationMinutes
  }

  return Number.isFinite(entry.duration) ? entry.duration : 0
}

const buildDailyTotals = (entries: StreakTimeEntry[]) => {
  const dailyTotals = new Map<string, number>()

  for (const entry of entries) {
    if (!entry.date) continue

    const key = entryDateKey(entry.date)
    dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + entryMinutes(entry))
  }

  return dailyTotals
}

const calculateCurrentStreak = (successfulDays: Set<string>, today: Date) => {
  let streak = 0
  let cursor = new Date(today)

  // Check if today is a successful day and count it
  if (successfulDays.has(toDateKey(cursor))) {
    streak = 1
    cursor = addDays(cursor, -1)
  } else {
    // Today is not successful yet, start counting from yesterday
    cursor = addDays(cursor, -1)
  }

  // Count consecutive successful days backwards
  while (successfulDays.has(toDateKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

const calculateBestStreak = (successfulDays: Set<string>) => {
  let bestStreak = 0
  let currentStreak = 0
  const sortedDays = Array.from(successfulDays).sort()
  let previousDay: Date | null = null

  for (const dayKey of sortedDays) {
    const currentDay = new Date(`${dayKey}T00:00:00`)
    const expectedPreviousKey = previousDay ? toDateKey(addDays(previousDay, 1)) : null

    currentStreak = expectedPreviousKey === dayKey ? currentStreak + 1 : 1
    bestStreak = Math.max(bestStreak, currentStreak)
    previousDay = currentDay
  }

  return bestStreak
}

const fetchFocusStreakEntries = async (): Promise<StreakTimeEntry[]> => {
  const today = new Date()
  const startDate = toDateKey(addDays(today, -STREAK_LOOKBACK_DAYS))
  const endDate = toDateKey(today)
  const res = await timeEntriesApi.getByRange(startDate, endDate)

  return Array.isArray(res.data) ? res.data : []
}

/**
 * Resolves the goal the streak is measured against.
 *
 * Guards the value rather than trusting it: a persisted user object can
 * predate the field entirely, and a zero or negative would divide the
 * progress bar by zero.
 */
export const resolveDailyGoalMinutes = (goalFromUser: number | undefined): number =>
  typeof goalFromUser === 'number' && Number.isFinite(goalFromUser) && goalFromUser > 0
    ? goalFromUser
    : DEFAULT_DAILY_FOCUS_GOAL_MINUTES

export function useFocusStreak(): FocusStreakResult {
  const dailyGoalMinutes = useAuthStore((state) => resolveDailyGoalMinutes(state.user?.dailyFocusGoalMinutes))

  const query = useQuery({
    queryKey: ['dashboard', 'focus-streak'],
    queryFn: fetchFocusStreakEntries,
    staleTime: 2 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })

  const today = new Date()
  const todayKey = toDateKey(today)
  const entries = query.data ?? []
  const dailyTotals = buildDailyTotals(entries)
  const successfulDays = new Set(
    Array.from(dailyTotals.entries())
      .filter(([, minutes]) => minutes >= dailyGoalMinutes)
      .map(([date]) => date),
  )

  const todayMinutesTracked = dailyTotals.get(todayKey) ?? 0
  const minutesRemainingToday = Math.max(dailyGoalMinutes - todayMinutesTracked, 0)
  const showMotivation = minutesRemainingToday > 0 && minutesRemainingToday <= 5

  return {
    currentStreak: calculateCurrentStreak(successfulDays, today),
    bestStreak: calculateBestStreak(successfulDays),
    todayMinutesTracked,
    dailyGoalMinutes,
    todayProgressPercent: Math.min((todayMinutesTracked / dailyGoalMinutes) * 100, 100),
    minutesRemainingToday,
    showMotivation,
    motivationalMessage: showMotivation
      ? `Only ${minutesRemainingToday} minutes left to keep your streak alive 🔥`
      : undefined,
    isPending: query.isPending,
    isError: query.isError,
  }
}
