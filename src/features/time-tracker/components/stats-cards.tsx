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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="card-brutal text-center">
        <Timer className="mx-auto mb-2 h-8 w-8" />
        <div className="text-3xl font-bold">{formatDuration(todayTotalMinutes)}</div>
        <div className="font-mono text-sm uppercase text-gray-600">Today's Total</div>
      </div>
      <div className="card-brutal-colored bg-primary text-center">
        <Target className="mx-auto mb-2 h-8 w-8" />
        <div className="text-3xl font-bold">{todayEntries.length}</div>
        <div className="font-mono text-sm uppercase">Tasks Today</div>
      </div>
      <div className="card-brutal text-center">
        <History className="mx-auto mb-2 h-8 w-8" />
        <div className="text-3xl font-bold">{recentEntries.length}</div>
        <div className="font-mono text-sm uppercase text-gray-600">Last 7 Days</div>
      </div>
    </div>
  )
}
