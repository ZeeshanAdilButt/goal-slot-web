import { Clock } from 'lucide-react'

import { TimeEntry } from '@/features/time-tracker/utils/types'
import { formatDuration } from '@/lib/utils'

import { GlassCard } from '@/components/ui/glass-card'

interface DashboardRecentActivityProps {
  recentActivity: TimeEntry[]
}

export function DashboardRecentActivity({ recentActivity }: DashboardRecentActivityProps) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Recent Activity</h2>
      <GlassCard>
        {recentActivity.length === 0 ? (
          <div className="py-6 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
            <p className="text-xs text-zinc-500">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-semibold text-zinc-900"
                  style={{ backgroundColor: (entry.goal?.color || '#FFD700') + '40' }}
                >
                  {formatDuration(entry.duration).replace(' ', '')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{entry.taskName}</p>
                  <p className="truncate text-xs text-zinc-500">{entry.goal?.title || 'No Goal'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
