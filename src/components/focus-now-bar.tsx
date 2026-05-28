'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import { findScheduleBlockForDateTime } from '@/features/time-tracker/utils/schedule'
import { ArrowRight, Clock, Target } from 'lucide-react'

import { formatTime12h } from '@/lib/utils'

/** "14:00" -> "2 PM", "14:30" -> "2:30 PM". Drops :00 when on the hour. */
function fmtShort(time: string): string {
  return formatTime12h(time).replace(':00 ', ' ')
}

/**
 * Persistent strip under the top bar telling the user what schedule block
 * is active right now, with the linked goal, time window, countdown, and
 * a "View Schedule" link. Includes a thin progress bar at the bottom that
 * fills as the block elapses. Hides during free time.
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

  const parseHM = (s: string): number => {
    const [h, m] = s.split(':').map(Number)
    return h * 60 + m
  }
  const startMin = parseHM(activeBlock.startTime)
  const endMin = parseHM(activeBlock.endTime)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const totalLen = Math.max(1, endMin - startMin)
  const elapsed = Math.max(0, Math.min(totalLen, nowMin - startMin))
  const minutesLeft = Math.max(0, endMin - nowMin)
  const remaining =
    minutesLeft >= 60
      ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`
      : `${minutesLeft}m left`
  const pct = Math.round((elapsed / totalLen) * 100)

  return (
    <div className="relative border-b border-[#f2cc0d]/30 bg-gradient-to-r from-[#fffbea] via-[#fffbea] to-[#fff7d1]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2">
        {/* Pulsing live indicator + label */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f2cc0d] opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f2cc0d]" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a7307]">
            Focus now
          </span>
        </div>

        {/* Block title + goal */}
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0">
          <span className="truncate text-sm font-bold text-zinc-900">{activeBlock.title}</span>
          {activeBlock.goal?.title && (
            <span className="inline-flex items-center gap-1 truncate text-xs text-zinc-600">
              <Target className="h-3 w-3 shrink-0 text-[#8a7307]" />
              <span className="truncate">{activeBlock.goal.title}</span>
            </span>
          )}
        </div>

        {/* Time window + countdown + link */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-[#f2cc0d]/40 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
            <Clock className="h-3 w-3 text-[#8a7307]" />
            {fmtShort(activeBlock.startTime)} - {fmtShort(activeBlock.endTime)}
          </span>
          <span className="inline-flex items-center rounded-md bg-[#f2cc0d] px-2 py-0.5 text-[11px] font-bold text-zinc-900 tabular-nums">
            {remaining}
          </span>
          <Link
            href="/dashboard/schedule"
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-[#8a7307] transition-colors hover:bg-[#fff7d1] hover:text-[#6b5905]"
          >
            View Schedule
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Progress bar showing how much of this block has elapsed */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-[#f2cc0d] transition-[width] duration-500 ease-linear"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
    </div>
  )
}
