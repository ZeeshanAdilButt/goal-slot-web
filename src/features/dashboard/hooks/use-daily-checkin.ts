'use client'

import { useCallback } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { coachApi, type CoachDailyCheckin } from '@/lib/api'

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

const QUERY_KEY = ['coach', 'checkins', 'today'] as const

function fromDto(dto: CoachDailyCheckin | null | undefined): DailyCheckin | null {
  if (!dto) return null
  return {
    date: dto.date,
    mood: dto.mood,
    energy: dto.energy,
    focus: dto.focus,
    blocked: dto.blocked ?? '',
    worked: dto.worked ?? '',
    submittedAt: dto.updatedAt ?? dto.createdAt ?? new Date().toISOString(),
  }
}

export function useDailyCheckin() {
  const queryClient = useQueryClient()

  const query = useQuery<DailyCheckin | null>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await coachApi.getTodayCheckin()
      return fromDto(res.data)
    },
  })

  const mutation = useMutation({
    mutationFn: async (payload: Omit<DailyCheckin, 'date' | 'submittedAt'>) => {
      const date = todayKey()
      const res = await coachApi.upsertCheckin({
        date,
        mood: payload.mood,
        energy: payload.energy,
        focus: payload.focus,
        blocked: payload.blocked || undefined,
        worked: payload.worked || undefined,
      })
      return fromDto(res.data)
    },
    onSuccess: (next) => {
      queryClient.setQueryData<DailyCheckin | null>(QUERY_KEY, next)
      queryClient.invalidateQueries({ queryKey: ['coach', 'checkins'] })
    },
  })

  const submit = useCallback(
    (payload: Omit<DailyCheckin, 'date' | 'submittedAt'>) => {
      mutation.mutate(payload)
      // Return an optimistic shape, components that read this discard the value today.
      const date = todayKey()
      return {
        ...payload,
        date,
        submittedAt: new Date().toISOString(),
      } satisfies DailyCheckin
    },
    [mutation],
  )

  return {
    todayCheckin: query.data ?? null,
    submit,
  }
}
