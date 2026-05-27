'use client'

import { useCallback, useEffect, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coachApi, type CoachGoalReflection } from '@/lib/api'

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

function fromDto(goalId: string, weekKey: string, dto: CoachGoalReflection | null | undefined): GoalReflection | null {
  if (!dto) return null
  return {
    goalId,
    weekKey: dto.weekKey ?? weekKey,
    feel: dto.feel,
    worked: dto.worked ?? '',
    blocked: dto.blocked ?? '',
    nextWeekFocus: dto.nextWeekFocus ?? '',
    submittedAt: dto.updatedAt ?? dto.createdAt ?? new Date().toISOString(),
  }
}

export function useGoalReflection(goalId: string | null | undefined) {
  const queryClient = useQueryClient()
  const [weekKey, setWeekKey] = useState<string>('')

  useEffect(() => {
    setWeekKey(getISOWeekKey())
  }, [])

  const enabled = Boolean(goalId && weekKey)
  const query = useQuery<GoalReflection | null>({
    queryKey: ['coach', 'reflection', goalId ?? null, weekKey],
    enabled,
    queryFn: async () => {
      if (!goalId || !weekKey) return null
      const res = await coachApi.getGoalReflection(goalId, weekKey)
      return fromDto(goalId, weekKey, res.data)
    },
  })

  const mutation = useMutation({
    mutationFn: async (payload: Pick<GoalReflection, 'feel' | 'worked' | 'blocked' | 'nextWeekFocus'>) => {
      if (!goalId || !weekKey) throw new Error('Missing goalId or weekKey')
      const res = await coachApi.upsertGoalReflection(goalId, {
        weekKey,
        feel: payload.feel,
        worked: payload.worked || undefined,
        blocked: payload.blocked || undefined,
        nextWeekFocus: payload.nextWeekFocus || undefined,
      })
      return fromDto(goalId, weekKey, res.data)
    },
    onSuccess: (next) => {
      if (!goalId) return
      queryClient.setQueryData<GoalReflection | null>(['coach', 'reflection', goalId, weekKey], next)
      queryClient.invalidateQueries({ queryKey: ['coach', 'reflection', goalId] })
    },
  })

  const submit = useCallback(
    (payload: Pick<GoalReflection, 'feel' | 'worked' | 'blocked' | 'nextWeekFocus'>) => {
      if (!goalId || !weekKey) return null
      mutation.mutate(payload)
      return {
        ...payload,
        goalId,
        weekKey,
        submittedAt: new Date().toISOString(),
      } satisfies GoalReflection
    },
    [goalId, weekKey, mutation],
  )

  return {
    weekKey,
    lastReflection: query.data ?? null,
    submit,
  }
}

export { getISOWeekKey }
