'use client'

import { useCategoriesQuery } from '@/features/categories'
import { ActivePracticeReminders } from '@/features/dashboard/components/active-practice-reminders'
import { DailyCheckinCard } from '@/features/dashboard/components/daily-checkin-card'
import { DashboardGoals } from '@/features/dashboard/components/dashboard-goals'
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header'
import { DashboardRecentActivity } from '@/features/dashboard/components/dashboard-recent-activity'
import { DashboardScheduleCTA } from '@/features/dashboard/components/dashboard-schedule-cta'
import { DashboardStats } from '@/features/dashboard/components/dashboard-stats'
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-queries'

import { Loading } from '@/components/ui/loading'
import { PageShell } from '@/components/ui/page-shell'

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
    <PageShell>
      <DailyCheckinCard />

      <ActivePracticeReminders />

      <DashboardHeader />

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardGoals goals={goals} categories={categories} />

        <div className="space-y-6">
          <DashboardRecentActivity recentActivity={recentActivity} />
          <DashboardScheduleCTA />
        </div>
      </div>
    </PageShell>
  )
}
