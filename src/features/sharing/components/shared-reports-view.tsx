'use client'

import { useMemo, useState } from 'react'

import { FocusBreakdownCard } from '@/features/reports/components/focus-breakdown-card'
import { FocusCategoryPieCard } from '@/features/reports/components/focus-category-pie-card'
import { emptyFilters, FocusFilters, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusHourlyCard } from '@/features/reports/components/focus-hourly-card'
import { FocusTaskTotalCard } from '@/features/reports/components/focus-task-total-card'
import { FocusTimeGridCard } from '@/features/reports/components/focus-time-grid-card'
import { FocusTrendCard } from '@/features/reports/components/focus-trend-card'
import { ViewGranularityTabs } from '@/features/reports/components/view-granularity-tabs'
import type { FocusGranularity } from '@/features/reports/utils/types'
import { SharedReportExport } from '@/features/sharing/components/shared-report-export'
import { useSharedUserGoalsQuery } from '@/features/sharing/hooks/use-sharing-queries'
import { SharedGoal, SharedWithMeUser } from '@/features/sharing/utils/types'
import { User } from 'lucide-react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SharedReportsViewProps {
  sharedWithMe: SharedWithMeUser[]
}

export function SharedReportsView({ sharedWithMe }: SharedReportsViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    sharedWithMe.length > 0 ? sharedWithMe[0].owner.id : null,
  )
  const [view, setView] = useState<FocusGranularity>('week')
  const [filters, setFilters] = useState<ReportFilterState>(emptyFilters)

  const selectedUser = sharedWithMe.find((s) => s.owner.id === selectedUserId)?.owner

  // Fetch goals for selected user to populate filters
  const goalsQuery = useSharedUserGoalsQuery(selectedUserId)

  const sharedGoals = useMemo(() => (goalsQuery.data ?? []) as SharedGoal[], [goalsQuery.data])

  // Adapt shared goals for the filter component
  const filterGoals = useMemo(
    () =>
      sharedGoals.map((g) => ({
        id: g.id,
        title: g.title,
        color: g.color,
        isEnabled: true,
        order: 0,
        targetHours: g.targetHours,
        period: 'weekly',
      })),
    [sharedGoals],
  )

  // Extract categories from shared goals for the filter component
  const filterCategories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    sharedGoals.forEach((g) => {
      if (g.category) uniqueCategories.add(g.category)
    })
    return Array.from(uniqueCategories).map((cat) => ({
      id: cat, // Using name as ID for simplicity in shared view
      name: cat,
      color: null,
    }))
  }, [sharedGoals])

  if (sharedWithMe.length === 0) {
    return (
      <div className="card-brutal py-16 text-center">
        <User className="mx-auto mb-4 h-16 w-16 opacity-30" />
        <h3 className="mb-2 text-xl font-bold uppercase">No shared reports</h3>
        <p className="font-mono text-gray-600">
          When someone shares their data with you, you&apos;ll be able to view their reports here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-gray-900">
      {/* User Selector Card */}
      <div className="card-brutal">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold uppercase sm:text-xl">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Viewing Reports For
            </h2>
            <p className="font-mono text-xs text-gray-600 sm:text-sm">Select a person to view their focus reports</p>
          </div>

          <Select value={selectedUserId || ''} onValueChange={(v) => setSelectedUserId(v)}>
            <SelectTrigger className="h-12 w-full border-3 border-secondary bg-white py-2 sm:w-[300px]">
              <SelectValue placeholder="Select a person" />
            </SelectTrigger>
            <SelectContent>
              {sharedWithMe.map((share) => (
                <SelectItem key={share.owner.id} value={share.owner.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center border-2 border-secondary bg-primary text-xs font-bold">
                      {share.owner.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">{share.owner.name}</span>
                      <span className="font-mono text-xs text-gray-500">{share.owner.email}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedUser && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="card-brutal sticky top-0 z-10 bg-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Group: View Toggles & Filters */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ViewGranularityTabs value={view} onChange={setView} />

                <div className="hidden h-8 w-0.5 bg-gray-200 sm:block" />

                <FocusFilters
                  filters={filters}
                  onChange={setFilters}
                  explicitGoals={filterGoals as any}
                  explicitCategories={filterCategories}
                />
              </div>

              {/* Right Group: Export */}
              <SharedReportExport userId={selectedUserId!} userName={selectedUser.name ?? 'report'} />
            </div>
          </div>

          <div className="grid gap-6">
            <FocusTrendCard view={view} filters={filters} reportUserId={selectedUserId ?? undefined} />

            <div className="grid gap-6 lg:grid-cols-2">
              <FocusBreakdownCard
                view={view}
                groupBy="goal"
                filters={filters}
                reportUserId={selectedUserId ?? undefined}
              />
              <FocusBreakdownCard
                view={view}
                groupBy="task"
                filters={filters}
                reportUserId={selectedUserId ?? undefined}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <FocusHourlyCard view={view} filters={filters} reportUserId={selectedUserId ?? undefined} />
              <FocusCategoryPieCard view={view} filters={filters} reportUserId={selectedUserId ?? undefined} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <FocusTaskTotalCard view={view} filters={filters} reportUserId={selectedUserId ?? undefined} />
              <FocusTimeGridCard view={view} filters={filters} reportUserId={selectedUserId ?? undefined} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
