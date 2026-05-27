import { DashboardStats as DashboardStatsType } from '@/features/dashboard/utils/types'
import { CheckSquare, Clock, Target, TrendingUp } from 'lucide-react'

import { StatCard } from '@/components/ui/stat-card'

interface DashboardStatsProps {
  stats?: DashboardStatsType
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Today's Focus"
        value={stats?.todayFormatted || '0m'}
        icon={<Clock />}
        accent="brand"
      />
      <StatCard
        label="Weekly Total"
        value={stats?.weeklyFormatted || '0m'}
        icon={<TrendingUp />}
        accent="neutral"
      />
      <StatCard
        label="Active Goals"
        value={stats?.activeGoals ?? 0}
        icon={<Target />}
        accent="success"
      />
      <StatCard
        label="Tasks Logged"
        value={stats?.tasksLogged ?? 0}
        icon={<CheckSquare />}
        accent="warning"
      />
    </div>
  )
}
