'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'goalslot:coach:profile'

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
}

function readProfile(): CoachProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw) as Partial<CoachProfile>
    return { ...DEFAULT_PROFILE, ...parsed }
  } catch {
    return DEFAULT_PROFILE
  }
}

function writeProfile(profile: CoachProfile) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function useCoachProfile() {
  const [profile, setProfile] = useState<CoachProfile>(DEFAULT_PROFILE)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setProfile(readProfile())
    setIsLoaded(true)
  }, [])

  const save = useCallback(async (payload: CoachProfile) => {
    setIsSaving(true)
    await new Promise<void>((resolve) => setTimeout(resolve, 800))
    writeProfile(payload)
    setProfile(payload)
    setIsSaving(false)
    return { success: true as const }
  }, [])

  return {
    profile,
    isLoaded,
    isSaving,
    save,
  }
}
