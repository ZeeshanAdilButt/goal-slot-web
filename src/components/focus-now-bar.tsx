'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import { findScheduleBlockForDateTime } from '@/features/time-tracker/utils/schedule'
import { ArrowRight, Target } from 'lucide-react'

import { formatTime12h } from '@/lib/utils'

/** "14:00" -> "2 PM", "14:30" -> "2:30 PM". Drops :00 when on the hour. */
function fmtShort(time: string): string {
  const out = formatTime12h(time)
  return out.replace(':00 ', ' ')
}

/**
 * Standalone strip rendered under the persistent header bar telling the
 * user what schedule block is active right now, with the linked goal and
 * minutes remaining. Includes a "View Schedule" link to jump straight in.
 * Renders nothing during free time so the chrome stays clean.
 */
export function FocusNowBar() {
  const { weeklySchedule } = useTimeTrackerData()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const activeBlock = useMemo(() => {
    if (!weeklySchedule) return null
    return findScheduleBlockForDateTime(weeklySchedule, now)
  }, [weeklySchedule, now])

  if (!activeBlock) return null

  const [endH, endM] = (activeBlock.endTime || '').split(':').map(Number)
  const endMinutes = endH * 60 + endM
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const minutesLeft = Math.max(0, endMinutes - nowMinutes)
  const remaining =
    minutesLeft >= 60
      ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`
      : `${minutesLeft}m left`

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[#f2cc0d]/30 bg-[#fffbea] px-4 py-1.5 text-xs">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[#8a7307]">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f2cc0d] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#f2cc0d]" />
          </span>
          <span className="font-semibold uppercase tracking-wider text-[10px]">Focus now</span>
        </span>
        <span className="truncate font-semibold text-zinc-900">{activeBlock.title}</span>
        {activeBlock.goal?.title && (
          <span className="inline-flex items-center gap-1 text-[#8a7307]/80">
            <Target className="h-3 w-3" />
            {activeBlock.goal.title}
          </span>
        )}
        <span className="text-[#8a7307]/80">
          · {fmtShort(activeBlock.startTime)} - {fmtShort(activeBlock.endTime)}
        </span>
        <span className="text-[#8a7307]/80">· {remaining}</span>
      </div>
      <Link
        href="/dashboard/schedule"
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#8a7307] hover:text-[#6b5905]"
      >
        View Schedule
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
