import { TimeEntry } from '@/features/time-tracker/utils/types'
import { motion } from 'framer-motion'
import { Clock, History } from 'lucide-react'

import { GoalSlotSpinner } from '@/components/goalslot-logo'
import { formatDate, formatDuration } from '@/lib/utils'

interface RecentEntriesProps {
  recentEntries: TimeEntry[]
  isLoading: boolean
}

export function RecentEntries({ recentEntries, isLoading }: RecentEntriesProps) {
  return (
    <div className="card-brutal">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase sm:mb-6 sm:text-xl md:text-2xl">
        <History className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="hidden sm:inline">Recent Time Entries</span>
        <span className="sm:hidden">Recent Entries</span>
      </h2>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <GoalSlotSpinner size="md" />
        </div>
      ) : recentEntries.length === 0 ? (
        <div className="py-6 text-center text-gray-500 sm:py-8">
          <Clock className="mx-auto mb-3 h-10 w-10 opacity-50 sm:mb-4 sm:h-12 sm:w-12" />
          <p className="font-mono text-sm uppercase sm:text-base">No entries yet</p>
          <p className="text-xs sm:text-sm">Start tracking your time!</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {recentEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-2 border-2 border-secondary bg-white p-3 transition-all hover:shadow-brutal sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-2 w-2 shrink-0 rounded-full bg-primary sm:h-3 sm:w-3" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold sm:text-base">{entry.taskName}</div>
                  <div className="truncate font-mono text-xs text-gray-500">
                    {entry.goal && `${entry.goal.title}`}
                    {entry.notes && ` • ${entry.notes}`}
                  </div>
                </div>
              </div>
              <div className="ml-5 text-left sm:ml-0 sm:text-right">
                <div className="font-mono text-sm font-bold sm:text-base">{formatDuration(entry.duration)}</div>
                <div className="font-mono text-xs text-gray-500">{formatDate(entry.date)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
