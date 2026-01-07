import { TimeEntry } from '@/features/time-tracker/utils/types'
import { History, Target, Timer } from 'lucide-react'

import { formatDuration } from '@/lib/utils'

interface StatsCardsProps {
  recentEntries: TimeEntry[]
}

export function StatsCards({ recentEntries }: StatsCardsProps) {
  // Normalize date to YYYY-MM-DD format for comparison
  const today = new Date().toISOString().split('T')[0]
  const normalizeDate = (date: string) => {
    // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss.sssZ" formats
    return date.split('T')[0]
  }

  const todayEntries = recentEntries.filter((e) => normalizeDate(e.date) === today)
  const todayTotalMinutes = todayEntries.reduce((sum, e) => sum + e.duration, 0)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
      <div className="card-brutal text-center">
        <Timer className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8" />
        <div className="text-2xl font-bold sm:text-3xl">{formatDuration(todayTotalMinutes)}</div>
        <div className="font-mono text-xs uppercase text-gray-600 sm:text-sm">Today's Total</div>
      </div>
      <div className="card-brutal-colored bg-primary text-center">
        <Target className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8" />
        <div className="text-2xl font-bold sm:text-3xl">{todayEntries.length}</div>
        <div className="font-mono text-xs uppercase sm:text-sm">Tasks Today</div>
      </div>
      <div className="card-brutal text-center">
        <History className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8" />
        <div className="text-2xl font-bold sm:text-3xl">{recentEntries.length}</div>
        <div className="font-mono text-xs uppercase text-gray-600 sm:text-sm">Last 7 Days</div>
      </div>
    </div>
  )
}
