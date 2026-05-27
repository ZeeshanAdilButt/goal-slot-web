import { TimeEntry } from '@/features/time-tracker/utils/types'
import { History, Target, Timer } from 'lucide-react'

import { formatDuration } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'

interface StatsCardsProps {
  recentEntries: TimeEntry[]
}

export function StatsCards({ recentEntries }: StatsCardsProps) {
  const today = new Date().toISOString().split('T')[0]
  const normalizeDate = (date: string) => date.split('T')[0]

  const todayEntries = recentEntries.filter((e) => normalizeDate(e.date) === today)
  const todayTotalMinutes = todayEntries.reduce((sum, e) => sum + e.duration, 0)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      <StatCard label="Today's Total" value={formatDuration(todayTotalMinutes)} icon={<Timer />} accent="neutral" />
      <StatCard label="Tasks Today" value={todayEntries.length} icon={<Target />} accent="brand" />
      <StatCard label="Last 7 Days" value={recentEntries.length} icon={<History />} accent="neutral" />
    </div>
  )
}
