'use client'

import { useEffect, useMemo, useState } from 'react'

import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import { findScheduleBlockForDateTime } from '@/features/time-tracker/utils/schedule'
import { Target } from 'lucide-react'

import { formatTime12h } from '@/lib/utils'

interface FocusNowBarProps {
  className?: string
}

/**
 * Inline strip showing what schedule block (and therefore goal) is active
 * right now, with a countdown to the end of the block. Renders nothing when
 * no block is currently active. Used inside the persistent header banner
 * when the timer is stopped, so the user always sees the answer to
 * "what should I be doing right now?".
 */
export function FocusNowBar({ className }: FocusNowBarProps) {
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

  // Calculate minutes remaining in the block.
  const [endH, endM] = (activeBlock.endTime || '').split(':').map(Number)
  const endMinutes = endH * 60 + endM
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const minutesLeft = Math.max(0, endMinutes - nowMinutes)
  const remaining =
    minutesLeft >= 60
      ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`
      : `${minutesLeft}m left`

  return (
    <div
      className={className}
      title={`On schedule: ${activeBlock.title} (${formatTime12h(activeBlock.startTime)} to ${formatTime12h(activeBlock.endTime)})`}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f2cc0d]/40 bg-[#fffbea] px-2.5 py-0.5 text-[11px] font-medium text-[#8a7307]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f2cc0d] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#f2cc0d]" />
        </span>
        <span className="truncate">
          <span className="font-semibold">Focus now:</span> {activeBlock.title}
        </span>
        {activeBlock.goal?.title && (
          <span className="hidden items-center gap-1 text-[10px] text-[#8a7307]/80 sm:inline-flex">
            <Target className="h-3 w-3" />
            {activeBlock.goal.title}
          </span>
        )}
        <span className="text-[10px] text-[#8a7307]/80">· {remaining}</span>
      </span>
    </div>
  )
}
