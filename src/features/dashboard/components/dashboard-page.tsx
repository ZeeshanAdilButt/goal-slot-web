'use client'

import { useCategoriesQuery } from '@/features/categories'
import { DashboardGoals } from '@/features/dashboard/components/dashboard-goals'
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header'
import { DashboardRecentActivity } from '@/features/dashboard/components/dashboard-recent-activity'
import { DashboardScheduleCTA } from '@/features/dashboard/components/dashboard-schedule-cta'
import { DashboardStats } from '@/features/dashboard/components/dashboard-stats'
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-queries'

import { Loading } from '@/components/ui/loading'

export function DashboardPage() {
  const { data: categories = [] } = useCategoriesQuery()
  const { stats, goals, recentActivity, isPending } = useDashboardData()

  if (isPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loading size="sm" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 md:space-y-8">
      <DashboardHeader />

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <DashboardGoals goals={goals} categories={categories} />

        <div className="space-y-6">
          <DashboardRecentActivity recentActivity={recentActivity} />
          <DashboardScheduleCTA />
        </div>
      </div>
    </div>
  )
}
