'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { readLastDashboardPath } from '@/lib/last-dashboard-path'
import { GoalSlotSpinner } from '@/components/goalslot-logo'

/**
 * The "open the app" door: goalslot.io/app.
 *
 * The session token lives in localStorage, so the server cannot tell who is
 * asking and this has to be a client redirect. It is decided from local state
 * alone, before any network call: a token means go straight to the last
 * dashboard page (or the dashboard home), no token means sign in first and
 * come back here. The dashboard itself confirms the session in the background.
 *
 * The landing page at / is deliberately left alone, so a signed-in user can
 * still read it, and one click on Dashboard brings them back here.
 */
export default function AppEntryPage() {
  const router = useRouter()

  useEffect(() => {
    let hasToken = false
    try {
      hasToken = !!localStorage.getItem('accessToken')
    } catch {
      // Storage blocked: treat as signed out.
    }
    router.replace(hasToken ? (readLastDashboardPath() ?? '/dashboard') : '/login?redirect=%2Fapp')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <GoalSlotSpinner size="xl" />
    </div>
  )
}
