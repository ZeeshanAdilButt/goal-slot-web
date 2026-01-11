'use client'

import { useMemo, useState } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { Download, User } from 'lucide-react'

import { FocusBreakdownCard } from '@/features/reports/components/focus-breakdown-card'
import { FocusCategoryPieCard } from '@/features/reports/components/focus-category-pie-card'
import { FocusFilters, emptyFilters, type ReportFilterState } from '@/features/reports/components/focus-filters'
import { FocusHourlyCard } from '@/features/reports/components/focus-hourly-card'
import { FocusTaskTotalCard } from '@/features/reports/components/focus-task-total-card'
import { FocusTimeGridCard } from '@/features/reports/components/focus-time-grid-card'
import { FocusTrendCard } from '@/features/reports/components/focus-trend-card'
import type { FocusGranularity, FocusTimeEntry } from '@/features/reports/utils/types'

import { useSharedUserGoalsQuery, useSharedUserTimeEntriesQuery } from '@/features/sharing/hooks/use-sharing-queries'
import { SharedGoal, SharedTimeEntry, SharedWithMeUser } from '@/features/sharing/utils/types'
import { cn, formatDuration } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface SharedReportsViewProps {
  sharedWithMe: SharedWithMeUser[]
}

const VIEW_TABS: Array<{ value: FocusGranularity; label: string }> = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

function getDateRangeForView(view: FocusGranularity): { startDate: string; endDate: string; label: string } {
  const today = new Date()
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')

  switch (view) {
    case 'day':
      return {
        startDate: formatDate(today),
        endDate: formatDate(today),
        label: format(today, 'MMMM d, yyyy'),
      }
    case 'week':
      return {
        startDate: formatDate(startOfWeek(today, { weekStartsOn: 1 })),
        endDate: formatDate(endOfWeek(today, { weekStartsOn: 1 })),
        label: `${format(startOfWeek(today, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(today, { weekStartsOn: 1 }), 'MMM d, yyyy')}`,
      }
    case 'month':
      return {
        startDate: formatDate(startOfMonth(today)),
        endDate: formatDate(endOfMonth(today)),
        label: format(today, 'MMMM yyyy'),
      }
  }
}

// Adapter to convert SharedTimeEntry to FocusTimeEntry
const adaptSharedEntry = (entry: SharedTimeEntry): FocusTimeEntry => ({
  id: entry.id,
  taskName: entry.taskName,
  duration: entry.duration,
  date: entry.date,
  startedAt: null,
  goalId: entry.goal?.id,
  goal: entry.goal ? {
    id: entry.goal.id,
    title: entry.goal.title,
    color: entry.goal.color,
    category: entry.goal.category
  } : null,
  taskId: null,
  task: {
    id: 'shared-task',
    title: entry.taskName,
    category: null
  },
  scheduleBlockId: null,
  scheduleBlock: null
})

export function SharedReportsView({ sharedWithMe }: SharedReportsViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    sharedWithMe.length > 0 ? sharedWithMe[0].owner.id : null,
  )
  const [view, setView] = useState<FocusGranularity>('week')
  const [filters, setFilters] = useState<ReportFilterState>(emptyFilters)

  const selectedUser = sharedWithMe.find((s) => s.owner.id === selectedUserId)?.owner
  const dateRange = useMemo(() => getDateRangeForView(view), [view])

  // Fetch time entries for selected user
  const entriesQuery = useSharedUserTimeEntriesQuery(selectedUserId, dateRange.startDate, dateRange.endDate)
  
  // Fetch goals for selected user to populate filters
  const goalsQuery = useSharedUserGoalsQuery(selectedUserId)

  const rawEntries = useMemo(() => (entriesQuery.data ?? []) as SharedTimeEntry[], [entriesQuery.data])
  const adaptedEntries = useMemo(() => rawEntries.map(adaptSharedEntry), [rawEntries])
  
  const sharedGoals = useMemo(() => (goalsQuery.data ?? []) as SharedGoal[], [goalsQuery.data])
  
  // Adapt shared goals for the filter component
  const filterGoals = useMemo(() => sharedGoals.map(g => ({
    id: g.id,
    title: g.title,
    color: g.color,
    isEnabled: true,
    order: 0,
    targetHours: g.targetHours,
    period: 'weekly'
  })), [sharedGoals])

  // Extract categories from shared goals for the filter component
  const filterCategories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    sharedGoals.forEach(g => {
      if (g.category) uniqueCategories.add(g.category)
    })
    return Array.from(uniqueCategories).map(cat => ({
      id: cat, // Using name as ID for simplicity in shared view
      name: cat,
      color: null
    }))
  }, [sharedGoals])

  // Export to CSV
  const handleExportCSV = () => {
    if (!selectedUser || rawEntries.length === 0) return
    
    const headers = ['Date', 'Duration', 'Goal', 'Task']
    const rows = rawEntries.map(entry => [
      entry.date,
      formatDuration(entry.duration),
      entry.goal?.title || '',
      entry.taskName || '',
    ])
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedUser.name}-time-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

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
            <SelectTrigger className="w-full border-3 border-secondary bg-white sm:w-[300px]">
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
           <div className="flex flex-col gap-4 sticky top-0 z-10 bg-background/95 pb-2 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-lg border-2 border-secondary bg-white p-1">
                {VIEW_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setView(tab.value)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-bold transition-all',
                      view === tab.value
                        ? 'bg-primary text-secondary shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                 <FocusFilters 
                    filters={filters} 
                    onChange={setFilters} 
                    explicitGoals={filterGoals as any} 
                    explicitCategories={filterCategories}
                 />

                 <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 border-2"
                    onClick={handleExportCSV}
                    disabled={adaptedEntries.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-mono text-gray-500">
               <span>
                  {dateRange.label}
               </span>
               <span className="h-1 w-1 rounded-full bg-gray-300" />
               <span>
                  {adaptedEntries.length} entries found
               </span>
            </div>
          </div>

          <div className="grid gap-6">
            <FocusTrendCard 
              view={view} 
              filters={filters} 
              explicitEntries={adaptedEntries}
              isLoading={entriesQuery.isLoading}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <FocusBreakdownCard 
                view={view} 
                groupBy="goal" 
                filters={filters}
                explicitEntries={adaptedEntries}
                isLoading={entriesQuery.isLoading}
              />
              <FocusBreakdownCard 
                view={view} 
                groupBy="task" 
                filters={filters}
                explicitEntries={adaptedEntries}
                 isLoading={entriesQuery.isLoading}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
               <FocusHourlyCard 
                 view={view} 
                 filters={filters}
                 explicitEntries={adaptedEntries}
                 isLoading={entriesQuery.isLoading}
               />
               <FocusCategoryPieCard 
                 view={view} 
                 filters={filters}
                 explicitEntries={adaptedEntries}
                 isLoading={entriesQuery.isLoading}
               />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <FocusTaskTotalCard 
                view={view} 
                filters={filters}
                explicitEntries={adaptedEntries}
                isLoading={entriesQuery.isLoading}
              />
              <FocusTimeGridCard 
                view={view} 
                filters={filters}
                explicitEntries={adaptedEntries}
                isLoading={entriesQuery.isLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
