'use client'

import { useState } from 'react'
import { useFilterableGoalsQuery, useFilterableTasksQuery } from '@/features/reports/hooks/use-detailed-summary-reports'
import { GROUP_BY_OPTIONS, HOURLY_RATE_STORAGE_KEY, VIEW_TYPE_OPTIONS } from '@/features/reports/utils/export-reports-constants'
import type { ReportGroupBy, ReportViewType } from '@/features/reports/utils/types'
import { format } from 'date-fns'
import { Calendar, ChevronDown, DollarSign, FileText, Filter, Layers, Target, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import AnimateChangeInHeight from '@/components/animate-change-in-height'
import DateRangePicker from '@/components/DateRangePicker'
import type { DateRangeValue } from '@/components/DateRangePicker/types'

export interface ExportReportsFiltersProps {
  state: {
    dateRangeValue: DateRangeValue
    setDateRangeValue: (v: DateRangeValue) => void
    viewType: ReportViewType
    setViewType: (v: ReportViewType) => void
    groupBy: ReportGroupBy
    setGroupBy: (v: ReportGroupBy) => void
    selectedGoalIds: string[]
    toggleGoalFilter: (goalId: string) => void
    setSelectedGoalIds: (v: string[] | ((prev: string[]) => string[])) => void
    selectedTaskIds: string[]
    toggleTaskFilter: (taskId: string) => void
    setSelectedTaskIds: (v: string[] | ((prev: string[]) => string[])) => void
    includeBillable: boolean
    setIncludeBillable: (v: boolean) => void
    hourlyRateInput: string
    setHourlyRateInput: (v: string) => void
    showScheduleContext: boolean
    setShowScheduleContext: (v: boolean) => void
    includeTaskNotes: boolean
    setIncludeTaskNotes: (v: boolean) => void
    dateRange: { startDate: string; endDate: string }
    clearFilters: () => void
    hasActiveFilters: boolean
  }
}

export function ExportReportsFilters({ state }: ExportReportsFiltersProps) {
  const {
    dateRangeValue,
    setDateRangeValue,
    viewType,
    setViewType,
    groupBy,
    setGroupBy,
    selectedGoalIds,
    setSelectedGoalIds,
    selectedTaskIds,
    setSelectedTaskIds,
    includeBillable,
    setIncludeBillable,
    hourlyRateInput,
    setHourlyRateInput,
    showScheduleContext,
    setShowScheduleContext,
    includeTaskNotes,
    setIncludeTaskNotes,
    dateRange,
    clearFilters,
    hasActiveFilters,
  } = state

  const goalsQuery = useFilterableGoalsQuery()
  const tasksQuery = useFilterableTasksQuery()
  const [goalPopoverOpen, setGoalPopoverOpen] = useState(false)
  const [taskPopoverOpen, setTaskPopoverOpen] = useState(false)
  const [draftGoalIds, setDraftGoalIds] = useState<string[]>(selectedGoalIds)
  const [draftTaskIds, setDraftTaskIds] = useState<string[]>(selectedTaskIds)

  const handleGoalPopoverOpenChange = (nextOpen: boolean) => {
    setGoalPopoverOpen(nextOpen)
    setDraftGoalIds(selectedGoalIds)
  }

  const handleTaskPopoverOpenChange = (nextOpen: boolean) => {
    setTaskPopoverOpen(nextOpen)
    setDraftTaskIds(selectedTaskIds)
  }

  const toggleDraftGoalFilter = (goalId: string) => {
    setDraftGoalIds((prev) => (prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]))
  }

  const toggleDraftTaskFilter = (taskId: string) => {
    setDraftTaskIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  const applyGoalFilters = () => {
    setSelectedGoalIds(draftGoalIds)
    setGoalPopoverOpen(false)
  }

  const applyTaskFilters = () => {
    setSelectedTaskIds(draftTaskIds)
    setTaskPopoverOpen(false)
  }

  return (
    <div className="card-brutal">
      <AnimateChangeInHeight>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h2 className="font-bold uppercase">Filters</h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <DateRangePicker
                value={dateRangeValue}
                onChange={setDateRangeValue}
                allowClearing={false}
                align="start"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>View Type</Label>
              <Select value={viewType} onValueChange={(v) => setViewType(v as ReportViewType)}>
                <SelectTrigger className="h-10 border-2 border-secondary text-left [&>span]:text-left">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIEW_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {viewType === 'summary' && (
              <div className="flex flex-col gap-2">
                <Label>Group By</Label>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as ReportGroupBy)}>
                  <SelectTrigger className="h-10 border-2 border-secondary text-left [&>span]:text-left">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_BY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Filter by Goal
              </Label>
              <Popover open={goalPopoverOpen} onOpenChange={handleGoalPopoverOpenChange}>
                <div className="flex w-full items-center gap-1">
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 w-full justify-between border-2 border-secondary">
                      {selectedGoalIds.length > 0 ? `${selectedGoalIds.length} selected` : 'All goals'}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  {selectedGoalIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedGoalIds([])}
                      title="Clear goal selection"
                      className="shrink-0"
                    >
                      <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                    </Button>
                  )}
                </div>
                <PopoverContent className="w-64 border-3 border-secondary bg-white p-2 shadow-brutal">
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {goalsQuery.isLoading ? (
                      <p className="py-4 text-center text-sm text-gray-500">Loading goals…</p>
                    ) : !goalsQuery.data?.length ? (
                      <p className="py-4 text-center text-sm text-gray-500">No items to select.</p>
                    ) : (
                      goalsQuery.data?.map((goal) => (
                        <label
                          key={goal.id}
                          className="flex cursor-pointer items-center gap-2 rounded p-2 focus-within:bg-primary/20 hover:bg-primary/20"
                        >
                          <Checkbox
                            checked={draftGoalIds.includes(goal.id)}
                            onCheckedChange={() => toggleDraftGoalFilter(goal.id)}
                          />
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: goal.color }} />
                          <span className="truncate text-sm">{goal.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <div className="mt-2 border-t border-secondary/30 pt-2">
                    <Button className="h-9 w-full" size="sm" onClick={applyGoalFilters}>
                      Apply filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Filter by Task
              </Label>
              <Popover open={taskPopoverOpen} onOpenChange={handleTaskPopoverOpenChange}>
                <div className="flex w-full items-center gap-1">
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 w-full justify-between border-2 border-secondary">
                      {selectedTaskIds.length > 0 ? `${selectedTaskIds.length} selected` : 'All tasks'}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  {selectedTaskIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedTaskIds([])}
                      title="Clear task selection"
                      className="shrink-0"
                    >
                      <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                    </Button>
                  )}
                </div>
                <PopoverContent className="w-64 border-3 border-secondary bg-white p-2 shadow-brutal">
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {tasksQuery.isLoading ? (
                      <p className="py-4 text-center text-sm text-gray-500">Loading tasks…</p>
                    ) : !tasksQuery.data?.length ? (
                      <p className="py-4 text-center text-sm text-gray-500">No items to select.</p>
                    ) : (
                      tasksQuery.data?.slice(0, 50).map((task) => (
                        <label
                          key={task.id}
                          className="flex cursor-pointer items-center gap-2 rounded p-2 focus-within:bg-primary/20 hover:bg-primary/20"
                        >
                          <Checkbox
                            checked={draftTaskIds.includes(task.id)}
                            onCheckedChange={() => toggleDraftTaskFilter(task.id)}
                          />
                          <span className="truncate text-sm">{task.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <div className="mt-2 border-t border-secondary/30 pt-2">
                    <Button className="h-9 w-full" size="sm" onClick={applyTaskFilters}>
                      Apply filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Billable Hours
              </Label>
              <div className="flex items-center gap-4 rounded-lg border-2 border-secondary p-3">
                <Switch checked={includeBillable} onCheckedChange={setIncludeBillable} />
                <span className="text-sm">Include billing</span>
              </div>
              {includeBillable && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rate:</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={hourlyRateInput}
                      onChange={(e) => {
                        const next = e.target.value
                        setHourlyRateInput(next)
                        const parsed = parseFloat(next)
                        if (Number.isFinite(parsed) && parsed >= 0) {
                          try {
                            window.localStorage.setItem(HOURLY_RATE_STORAGE_KEY, next)
                          } catch (error) {
                            console.error('Failed to save hourly rate', error)
                          }
                        }
                      }}
                      className="w-24 border-2 border-secondary pl-7"
                    />
                  </div>
                  <span className="text-sm text-gray-500">/hour</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Blocks
              </Label>
              <div className="flex items-center gap-4 rounded-lg border-2 border-secondary p-3">
                <Switch checked={showScheduleContext} onCheckedChange={setShowScheduleContext} />
                <span className="text-sm">Show schedule context</span>
              </div>
              {showScheduleContext && (
                <p className="text-xs text-gray-500">Entries will display which schedule block they were logged from</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Task Notes
              </Label>
              <div className="flex items-center gap-4 rounded-lg border-2 border-secondary p-3">
                <Switch checked={includeTaskNotes} onCheckedChange={setIncludeTaskNotes} />
                <span className="text-sm">Include task notes</span>
              </div>
              {includeTaskNotes && (
                <p className="text-xs text-gray-500">Show notes from individual tasks in the report</p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-gray-100 px-4 py-2 text-center font-mono text-sm">
            <span className="text-gray-600">Showing data from </span>
            <span className="font-semibold">{format(new Date(dateRange.startDate), 'MMM d, yyyy')}</span>
            <span className="text-gray-600"> to </span>
            <span className="font-semibold">{format(new Date(dateRange.endDate), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </AnimateChangeInHeight>
    </div>
  )
}
