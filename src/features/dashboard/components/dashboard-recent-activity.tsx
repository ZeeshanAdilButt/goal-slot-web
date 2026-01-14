import { Clock } from 'lucide-react'
import { TimeEntry } from '@/features/time-tracker/utils/types'
import { formatDuration } from '@/lib/utils'

interface DashboardRecentActivityProps {
  recentActivity: TimeEntry[]
}

export function DashboardRecentActivity({ recentActivity }: DashboardRecentActivityProps) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold uppercase sm:text-xl">Recent Activity</h2>
      <div className="card-brutal">
        {recentActivity.length === 0 ? (
          <div className="py-4 text-center sm:py-8">
            <Clock className="mx-auto mb-2 h-8 w-8 text-gray-400 sm:mb-3 sm:h-10 sm:w-10" />
            <p className="font-mono text-xs text-gray-600 sm:text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-1 sm:space-y-3">
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 border-2 border-secondary bg-brutalist-bg p-1.5 sm:gap-3 sm:p-3"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-secondary font-mono text-xs font-bold sm:h-12 sm:w-12 sm:text-sm"
                  style={{ backgroundColor: entry.goal?.color || '#FFD700' }}
                >
                  {formatDuration(entry.duration).replace(' ', '')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold sm:text-sm">{entry.taskName}</p>
                  <p className="truncate font-mono text-xs text-gray-600">{entry.goal?.title || 'No Goal'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
