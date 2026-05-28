'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useCoachInsights } from '@/features/coach/hooks/use-coach-insights'
import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Quick-access Coach button that floats next to NotificationsButton + Feedback
 * in the bottom-right of every page. Hidden on the Coach page itself (no need
 * to deep-link to where you already are). Shows a small brand-yellow dot when
 * there are PROPOSED insights waiting so the user can spot fresh suggestions
 * from anywhere in the app.
 */
export function FloatingCoachButton() {
  // Gate before mounting the React Query hook so we don't fire /api/coach/insights
  // from unauthenticated landing / auth pages.
  const pathname = usePathname() ?? ''
  const onCoach = pathname.startsWith('/dashboard/coach')
  const onDashboardArea = pathname.startsWith('/dashboard')
  if (onCoach || !onDashboardArea) return null
  return <FloatingCoachButtonInner />
}

function FloatingCoachButtonInner() {
  const { insights } = useCoachInsights('PROPOSED')
  const fresh = insights.length

  return (
    <Link
      href="/dashboard/coach"
      aria-label={fresh > 0 ? `Open Coach (${fresh} fresh suggestion${fresh === 1 ? '' : 's'})` : 'Open Coach'}
      className={cn(
        'group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#f2cc0d] hover:text-[#8a7307]',
      )}
    >
      <Sparkles className="h-5 w-5" />
      {fresh > 0 && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#f2cc0d] px-1 text-[10px] font-bold text-zinc-900 ring-2 ring-white"
        >
          {fresh > 9 ? '9+' : fresh}
        </span>
      )}
    </Link>
  )
}
