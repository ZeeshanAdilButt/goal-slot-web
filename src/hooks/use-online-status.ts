'use client'

import { useEffect, useState } from 'react'

import { onlineManager } from '@tanstack/react-query'

// Tracks online state via React Query's onlineManager, the same signal that
// pauses/resumes mutations, so the UI and network behavior stay in sync.
export function useOnlineStatus(): boolean {
  // Default true to avoid an offline flash before hydration.
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(onlineManager.isOnline())
    return onlineManager.subscribe((online) => {
      setIsOnline(online)
    })
  }, [])

  return isOnline
}
