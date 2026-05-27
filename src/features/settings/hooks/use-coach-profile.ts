'use client'

import { useCallback } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  coachApi,
  type CoachHabitsProfileDto,
  type ReligiousContextEnum,
} from '@/lib/api'

export interface CoachProfile {
  why: string
  phoneBlockerInstalled: boolean
  distractingSubsCancelled: boolean
  websiteBlockerUrls: string
  sleepTargetHours: number
  bedtime: string
  wakeTime: string
  workEnvironment: string
  additionalContext: string
  religiousContext: ReligiousContextEnum
  spiritualNotes: string
}

const DEFAULT_PROFILE: CoachProfile = {
  why: '',
  phoneBlockerInstalled: false,
  distractingSubsCancelled: false,
  websiteBlockerUrls: '',
  sleepTargetHours: 8,
  bedtime: '23:00',
  wakeTime: '07:00',
  workEnvironment: '',
  additionalContext: '',
  religiousContext: 'NONE',
  spiritualNotes: '',
}

const QUERY_KEY = ['coach', 'habits-profile'] as const

function fromDto(dto: CoachHabitsProfileDto | null | undefined): CoachProfile {
  if (!dto) return DEFAULT_PROFILE
  return {
    why: dto.why ?? '',
    phoneBlockerInstalled: dto.phoneBlockerInstalled ?? false,
    distractingSubsCancelled: dto.distractingSubsCancelled ?? false,
    websiteBlockerUrls: dto.websiteBlockerUrls ?? '',
    sleepTargetHours: dto.sleepTargetHours ?? 8,
    bedtime: dto.bedtime ?? '23:00',
    wakeTime: dto.wakeTime ?? '07:00',
    workEnvironment: dto.workEnvironment ?? '',
    additionalContext: dto.additionalContext ?? '',
    religiousContext: dto.religiousContext ?? 'NONE',
    spiritualNotes: dto.spiritualNotes ?? '',
  }
}

export function useCoachProfile() {
  const queryClient = useQueryClient()

  const query = useQuery<CoachProfile>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await coachApi.getHabitsProfile()
      return fromDto(res.data)
    },
  })

  const mutation = useMutation({
    mutationFn: async (payload: CoachProfile) => {
      const res = await coachApi.updateHabitsProfile(payload)
      return fromDto(res.data)
    },
    onSuccess: (next) => {
      queryClient.setQueryData<CoachProfile>(QUERY_KEY, next)
    },
  })

  const save = useCallback(
    async (payload: CoachProfile) => {
      try {
        await mutation.mutateAsync(payload)
        return { success: true as const }
      } catch (err) {
        return { success: false as const, error: err }
      }
    },
    [mutation],
  )

  return {
    profile: query.data ?? DEFAULT_PROFILE,
    isLoaded: !query.isLoading,
    isSaving: mutation.isPending,
    save,
  }
}
