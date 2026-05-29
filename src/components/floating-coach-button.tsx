'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { useCoachInsights } from '@/features/coach/hooks/use-coach-insights'
import { MessageCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

import { FloatingCoachPopover } from './floating-coach-popover'
import { CoachIcon } from './icons/coach-icon'
import { JournalSpark } from './icons/journal-spark'

/**
 * Floating Coach button anchored bottom-right on every authenticated page.
 * Clicking opens an in-screen chat popover so the user can ask the Coach
 * a quick question without leaving their current screen. The popover header
 * has an Expand button to jump to the full Coach page when more room is
 * needed. Shows a brand-yellow count badge when there are PROPOSED insights
 * waiting.
 */
export function FloatingCoachButton() {
  const pathname = usePathname() ?? ''
  const onCoach = pathname.startsWith('/dashboard/coach')
  const onDashboardArea = pathname.startsWith('/dashboard')
  if (onCoach || !onDashboardArea) return null
  return <FloatingCoachButtonInner />
}

function FloatingCoachButtonInner() {
  const { insights } = useCoachInsights('PROPOSED')
  const fresh = insights.length
  const [open, setOpen] = useState(false)

  // Bridge for the Ctrl+K command palette: any code can dispatch
  // `goalslot:open-coach` on window and the floating chat opens.
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('goalslot:open-coach', handler as EventListener)
    return () => window.removeEventListener('goalslot:open-coach', handler as EventListener)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={
          fresh > 0
            ? `Open Coach quick chat (${fresh} fresh suggestion${fresh === 1 ? '' : 's'})`
            : 'Open Coach quick chat'
        }
        className={cn(
          'group relative inline-flex h-12 w-12 items-center justify-center rounded-full border bg-white text-zinc-700 shadow-lg transition-all hover:-translate-y-0.5 hover:border-[#f2cc0d] hover:text-[#8a7307]',
          open
            ? 'border-[#f2cc0d] text-[#8a7307]'
            : 'border-zinc-200',
        )}
      >
        {open ? (
          <MessageCircle className="h-5 w-5" />
        ) : (
          <span className="relative inline-flex h-9 w-9 items-center justify-center">
            <CoachIcon className="h-8 w-8 [filter:drop-shadow(0_0_4px_rgba(242,204,13,0.6))]" />
            <JournalSpark className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 motion-safe:animate-[journal-spark_3s_ease-in-out_infinite]" />
            <JournalSpark
              className="absolute -left-0.5 top-1 h-2 w-2 motion-safe:animate-[journal-spark_3s_ease-in-out_infinite]"
              style={{ animationDelay: '1s' }}
            />
            <JournalSpark
              className="absolute -bottom-0.5 right-1 h-2 w-2 motion-safe:animate-[journal-spark_3s_ease-in-out_infinite]"
              style={{ animationDelay: '2s' }}
            />
          </span>
        )}
        {fresh > 0 && !open && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#f2cc0d] px-1 text-[10px] font-bold text-zinc-900 ring-2 ring-white"
          >
            {fresh > 9 ? '9+' : fresh}
          </span>
        )}
      </button>
      <FloatingCoachPopover open={open} onClose={() => setOpen(false)} />
    </>
  )
}
