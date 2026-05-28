'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import {
  findScheduleBlockForDateTime,
  findUpcomingScheduleBlocks,
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

  const upcomingList = useMemo(() => {
    if (!weeklySchedule) return []
    return findUpcomingScheduleBlocks(weeklySchedule, now, 4)
  }, [weeklySchedule, now])
  const upcoming = upcomingList[0] ?? null

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
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-900 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold tracking-tight text-white transition-colors hover:bg-zinc-800"
              title={`Up next: ${upcoming.block.title}`}
            >
              <span className="text-[#f2cc0d]">Up next</span>
              <span aria-hidden className="h-3 w-px bg-zinc-700" />
              <span className="tabular-nums text-zinc-200">{upcomingLabel}</span>
              <ChevronDown
                className={cn('h-3 w-3 text-zinc-400 transition-transform', expanded && 'rotate-180')}
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

      {/* Up next panel — floats over the content below the bar instead
          of taking flow space, so the yellow ticker strip keeps its
          natural height and the dark card visually separates. Right-
          aligned, fixed-width, distinct dark card. */}
      {expanded && upcomingList.length > 0 && (
        <div className="absolute right-3 top-full z-40 mt-2 w-[min(28rem,calc(100vw-1.5rem))]">
          <div className="overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950 text-white shadow-2xl ring-1 ring-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f2cc0d]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#f2cc0d]">
                  Up next
                </span>
                <span className="text-[10px] text-zinc-500">
                  next {upcomingList.length}
                </span>
              </div>
              <Link
                href="/dashboard/schedule"
                onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-[#f2cc0d] transition-colors hover:bg-zinc-800"
                title="Open schedule"
              >
                Open schedule
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="divide-y divide-zinc-800">
              {upcomingList.map(({ block, startsAt }, idx) => {
                const label = describeUpcoming(now, startsAt)
                return (
                  <li
                    key={`${block.id}-${idx}`}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-bold text-[#f2cc0d] tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-semibold text-white">
                          {block.title}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-400">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="h-3 w-3 text-zinc-500" />
                          {fmtShort(block.startTime)} - {fmtShort(block.endTime)}
                        </span>
                        <span aria-hidden className="text-zinc-700">·</span>
                        <span className="text-[#f2cc0d]">{label}</span>
                        {block.goal?.title && (
                          <>
                            <span aria-hidden className="text-zinc-700">·</span>
                            <span className="inline-flex items-center gap-1 truncate text-zinc-400">
                              <GoalFlagIcon className="h-3 w-3 shrink-0 text-[#f2cc0d]/80" />
                              <span className="truncate">{block.goal.title}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
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
