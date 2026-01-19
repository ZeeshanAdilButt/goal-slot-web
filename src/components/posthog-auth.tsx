'use client'

import { useEffect } from 'react'

import { usePostHog } from 'posthog-js/react'

import { useAuthStore } from '@/lib/store'

/**
 * Single source of truth for PostHog user identification
 * Reactively identifies users whenever auth state changes (login, register, SSO, page refresh)
 * Also handles PostHog session reset on logout
 */
export default function PostHogAuth(): null {
  const posthog = usePostHog()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Identify user if authenticated but not yet identified
    // This handles all cases: login, register, SSO login, and page refresh
    if (isAuthenticated && user && !posthog._isIdentified()) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        userType: user.userType,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        unlimitedAccess: user.unlimitedAccess,
        maxGoals: user.limits.maxGoals,
        maxSchedules: user.limits.maxSchedules,
        maxTasksPerDay: user.limits.maxTasksPerDay,
      })
    }

    // Reset PostHog session on logout (safety net, store also handles this)
    if (!isAuthenticated && posthog._isIdentified()) {
      posthog.reset()
    }
  }, [posthog, user, isAuthenticated])

  return null
}
