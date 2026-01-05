import { useGoalStatsQuery } from '@/features/goals/hooks/use-goals-queries'
import { GoalStats } from '@/features/goals/utils/types'

import { useHasProAccess } from '@/lib/store'
import { Loading } from '@/components/ui/loading'

export function GoalsStats() {
  const hasProAccess = useHasProAccess()
  const statsQuery = useGoalStatsQuery()

  if (statsQuery.isPending) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loading size="sm" />
      </div>
    )
  }

  const stats = statsQuery.data as GoalStats
  return (
    <>
      {/* Free Plan Limit Notice */}
      {!hasProAccess && (stats?.active || 0) >= 3 && (
        <div className="card-brutal-colored bg-primary">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold uppercase">You've reached your free plan limit</p>
              <p className="font-mono text-sm">Upgrade to Pro for unlimited goals</p>
            </div>
            <a
              href="/dashboard/settings#billing"
              className="btn-brutal-dark w-full text-center sm:w-auto"
            >
              Upgrade to Pro
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {[
          { label: 'Active', value: stats?.active || 0, color: 'bg-accent-green' },
          { label: 'Completed', value: stats?.completed || 0, color: 'bg-accent-blue' },
          { label: 'Paused', value: stats?.paused || 0, color: 'bg-primary' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} border-3 border-secondary p-4 text-center shadow-brutal sm:p-6`}
          >
            <div className="font-mono text-3xl font-bold sm:text-4xl">{stat.value}</div>
            <div className="font-bold uppercase">{stat.label}</div>
          </div>
        ))}
      </div>
    </>
  )
}
