'use client'

import { useCallback } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

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
      // Server is authoritative — replace whatever optimistic shape we
      // wrote in submit() with the real row (real id, real timestamps).
      queryClient.setQueryData<DailyCheckin | null>(QUERY_KEY, next)
      queryClient.invalidateQueries({ queryKey: ['coach', 'checkins'] })
    },
    onError: (err: any) => {
      // Roll back the optimistic insert so the prompt comes back and the
      // user gets a chance to retry, instead of a silently-stale "done"
      // state. The banner kept showing "How did today land?" after submit
      // when the network blip swallowed the upsert — surface it now.
      queryClient.setQueryData<DailyCheckin | null>(QUERY_KEY, null)
      const msg = err?.response?.data?.message || err?.message || 'Could not save check-in. Try again.'
      toast.error(msg)
    },
  })

  const submit = useCallback(
    (payload: Omit<DailyCheckin, 'date' | 'submittedAt'>) => {
      const date = todayKey()
      const optimistic: DailyCheckin = {
        ...payload,
        date,
        submittedAt: new Date().toISOString(),
      }
      // Optimistically mark today as checked-in so every surface that
      // reads `todayCheckin` (the banner, the dashboard summary chips)
      // updates immediately. onSuccess replaces this with the real row,
      // onError rolls it back.
      queryClient.setQueryData<DailyCheckin | null>(QUERY_KEY, optimistic)
      mutation.mutate(payload)
      return optimistic
    },
    [mutation, queryClient],
  )

  return {
    todayCheckin: query.data ?? null,
    submit,
  }
}
