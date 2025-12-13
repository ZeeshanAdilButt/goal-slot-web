import { motion } from 'framer-motion'
import { Clock, History } from 'lucide-react'
import { formatDate, formatDuration } from '@/lib/utils'
import { TimeEntry } from '../utils/types'

interface RecentEntriesProps {
  recentEntries: TimeEntry[]
  isLoading: boolean
}

export function RecentEntries({ recentEntries, isLoading }: RecentEntriesProps) {
  return (
    <div className="card-brutal">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold uppercase">
        <History className="h-6 w-6" />
        Recent Time Entries
      </h2>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin border-4 border-secondary border-t-primary" />
        </div>
      ) : recentEntries.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="font-mono uppercase">No entries yet</p>
          <p className="text-sm">Start tracking your time!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between border-2 border-secondary bg-white p-4 transition-all hover:shadow-brutal"
            >
              <div className="flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <div>
                  <div className="font-bold">{entry.taskName}</div>
                  <div className="font-mono text-xs text-gray-500">
                    {entry.goal && `${entry.goal.title}`}
                    {entry.notes && ` • ${entry.notes}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">{formatDuration(entry.duration)}</div>
                <div className="font-mono text-xs text-gray-500">{formatDate(entry.date)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
