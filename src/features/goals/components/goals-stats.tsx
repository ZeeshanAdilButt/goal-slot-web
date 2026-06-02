import { useGoalStatsQuery } from '@/features/goals/hooks/use-goals-queries'
import { GoalStats } from '@/features/goals/utils/types'

import { useHasProAccess } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Loading } from '@/components/ui/loading'
import { StatCard } from '@/components/ui/stat-card'

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
        <GlassCard className="border-yellow-200 bg-yellow-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-zinc-900">You&apos;ve reached your free plan limit</p>
              <p className="text-sm text-zinc-600">Upgrade to Pro for unlimited goals</p>
            </div>
            <Button asChild variant="default" className="w-full sm:w-auto">
              <a href="/dashboard/settings#billing">Upgrade to Pro</a>
            </Button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active" value={stats?.active || 0} accent="success" />
        <StatCard label="Completed" value={stats?.completed || 0} accent="neutral" />
        <StatCard label="Paused" value={stats?.paused || 0} accent="brand" />
      </div>
    </>
  )
}
