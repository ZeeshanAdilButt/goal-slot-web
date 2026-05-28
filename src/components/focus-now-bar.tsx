'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import {
  findNextScheduleBlock,
  findScheduleBlockForDateTime,
} from '@/features/time-tracker/utils/schedule'
import { ArrowRight, ChevronDown, Clock } from 'lucide-react'

import { cn, formatTime12h } from '@/lib/utils'
import { GoalFlagIcon } from '@/components/icons/goal-flag-icon'

/** "14:00" -> "2 PM", "14:30" -> "2:30 PM". Drops :00 when on the hour. */
function fmtShort(time: string): string {
  return formatTime12h(time).replace(':00 ', ' ')
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function describeUpcoming(now: Date, startsAt: Date): string {
  const sameDay =
    now.getFullYear() === startsAt.getFullYear() &&
    now.getMonth() === startsAt.getMonth() &&
    now.getDate() === startsAt.getDate()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isTomorrow =
    tomorrow.getFullYear() === startsAt.getFullYear() &&
    tomorrow.getMonth() === startsAt.getMonth() &&
    tomorrow.getDate() === startsAt.getDate()
  if (sameDay) {
    const diffMin = Math.max(0, Math.round((startsAt.getTime() - now.getTime()) / 60000))
    if (diffMin <= 0) return 'starting now'
    if (diffMin < 60) return `in ${diffMin}m`
    const h = Math.floor(diffMin / 60)
    const m = diffMin % 60
    return m === 0 ? `in ${h}h` : `in ${h}h ${m}m`
  }
  if (isTomorrow) return 'tomorrow'
  return DAY_LABELS[startsAt.getDay()]
}

/**
 * Persistent strip under the top bar telling the user what schedule block
 * is active right now, with the linked goal, time window, countdown, a
 * link to the schedule, and the next upcoming block. Click the "Up next"
 * chip to expand a details drop-down (block title + goal + time window +
 * direct link into the schedule).
 */
export function FocusNowBar() {
  const { weeklySchedule } = useTimeTrackerData()
  const [now, setNow] = useState(() => new Date())
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const activeBlock = useMemo(() => {
    if (!weeklySchedule) return null
    return findScheduleBlockForDateTime(weeklySchedule, now)
  }, [weeklySchedule, now])

  const upcoming = useMemo(() => {
    if (!weeklySchedule) return null
    return findNextScheduleBlock(weeklySchedule, now)
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

  const upcomingLabel = upcoming ? describeUpcoming(now, upcoming.startsAt) : null

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
              <GoalFlagIcon className="h-3 w-3 shrink-0 text-[#8a7307]" />
              <span className="truncate">{activeBlock.goal.title}</span>
            </span>
          )}
        </div>

        {/* Time window + countdown + up-next + link */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-[#f2cc0d]/40 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
            <Clock className="h-3 w-3 text-[#8a7307]" />
            {fmtShort(activeBlock.startTime)} - {fmtShort(activeBlock.endTime)}
          </span>
          <span className="inline-flex items-center rounded-md bg-[#f2cc0d] px-2 py-0.5 text-[11px] font-bold text-zinc-900 tabular-nums">
            {remaining}
          </span>
          {upcoming && upcomingLabel && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border border-zinc-900 bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold tracking-tight text-white transition-colors hover:bg-zinc-800',
              )}
              title="Up next"
            >
              <span className="text-[#f2cc0d]">Up next</span>
              <span className="text-zinc-400" aria-hidden>·</span>
              <span className="truncate max-w-[140px]">{upcoming.block.title}</span>
              <span className="text-zinc-300" aria-hidden>·</span>
              <span className="tabular-nums text-zinc-300">{upcomingLabel}</span>
              <ChevronDown
                className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')}
                aria-hidden
              />
            </button>
          )}
          <Link
            href="/dashboard/schedule"
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-[#8a7307] transition-colors hover:bg-[#fff7d1] hover:text-[#6b5905]"
          >
            View Schedule
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Up next details — drops down under the strip when expanded. Same
          visual register as the floating Start tracking surface: dark pill,
          brand-yellow accents, condensed body. */}
      {expanded && upcoming && (
        <div className="border-t border-[#f2cc0d]/30 bg-white/80 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a7307]">
                Up next
              </div>
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-bold text-zinc-900">
                  {upcoming.block.title}
                </span>
                <span className="text-[11px] text-zinc-500">{upcomingLabel}</span>
              </div>
              {upcoming.block.goal?.title && (
                <div className="inline-flex items-center gap-1 text-xs text-zinc-600">
                  <GoalFlagIcon className="h-3 w-3 shrink-0 text-[#8a7307]" />
                  <span className="truncate">{upcoming.block.goal.title}</span>
                </div>
              )}
              <div className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                <Clock className="h-3 w-3 text-zinc-500" />
                {fmtShort(upcoming.block.startTime)} - {fmtShort(upcoming.block.endTime)}
              </div>
            </div>
            <Link
              href="/dashboard/schedule"
              onClick={() => setExpanded(false)}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-900 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Open in schedule
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Progress bar showing how much of this block has elapsed */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-[#f2cc0d] transition-[width] duration-500 ease-linear"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
    </div>
  )
}
