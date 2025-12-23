import { useGoalStatsQuery } from '@/features/goals/hooks/use-goals-queries'
import { GoalStats } from '@/features/goals/utils/types'

import { useHasProAccess } from '@/lib/store'

export function GoalsStats() {
  const hasProAccess = useHasProAccess()
  const statsQuery = useGoalStatsQuery()

  if (statsQuery.isPending) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse bg-gray-200" />
        ))}
      </div>
    )
  }

  const stats = statsQuery.data as GoalStats
  return (
    <>
      {/* Free Plan Limit Notice */}
      {!hasProAccess && (stats?.active || 0) >= 3 && (
        <div className="card-brutal-colored bg-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold uppercase">You've reached your free plan limit</p>
              <p className="font-mono text-sm">Upgrade to Pro for unlimited goals</p>
            </div>
            <a href="/dashboard/settings#billing" className="btn-brutal-dark">
              Upgrade to Pro
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Active', value: stats?.active || 0, color: 'bg-accent-green' },
          { label: 'Completed', value: stats?.completed || 0, color: 'bg-accent-blue' },
          { label: 'Paused', value: stats?.paused || 0, color: 'bg-primary' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} border-3 border-secondary p-6 text-center shadow-brutal`}>
            <div className="font-mono text-4xl font-bold">{stat.value}</div>
            <div className="font-bold uppercase">{stat.label}</div>
          </div>
        ))}
      </div>
    </>
  )
}
