'use client'

import { useState } from 'react'

import { CompactTaskList } from '@/features/tasks/components/compact-task-list'
import { GoalsSidebarMobile } from '@/features/tasks/components/goals-sidebar/goals-sidebar-mobile'
import { TaskBoard } from '@/features/tasks/components/task-board'
import { TasksAdvancedFilters } from '@/features/tasks/components/tasks-advanced-filters'
import { TasksFilters } from '@/features/tasks/components/tasks-filters'
import { Goal, Task } from '@/features/tasks/utils/types'
import { PanelLeft, Plus, SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { GoalSlotSpinner } from '@/components/goalslot-logo'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskSort, TASK_SORT_OPTIONS } from '@/features/tasks/utils/sort-tasks'


interface TasksViewProps {
  tasks: Task[]
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onCreate: () => void
  hasSelectedGoal: boolean
  isLoading: boolean
  goals?: Goal[]
  selectedGoalId?: string | null
  onSelectGoal?: (id: string | null) => void
  selectedStatus?: string
  onSelectStatus?: (status: string) => void
  goalsLoading?: boolean
  showCompleted: boolean
  onShowCompletedChange: (show: boolean) => void
  dueDateFilter: string
  setDueDateFilter: (value: string) => void
  durationFilter: string
  setDurationFilter: (value: string) => void
  customDateStart: string
  setCustomDateStart: (value: string) => void
  customDateEnd: string
  setCustomDateEnd: (value: string) => void
  customDurationMin: number | ''
  setCustomDurationMin: (value: number | '') => void
  customDurationMax: number | ''
  setCustomDurationMax: (value: number | '') => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  hasActiveFilters: boolean
  onResetFilters: () => void
  goalsSidebarCollapsed?: boolean
  onToggleGoalsSidebar?: () => void
  className?: string,
  sortKey: TaskSort,
  onSortChange: (value: TaskSort) => void

}

export function TasksView({
  tasks,
  onComplete,
  onEdit,
  onCreate,
  hasSelectedGoal,
  isLoading,
  goals = [],
  selectedGoalId = null,
  onSelectGoal,
  selectedStatus = 'ACTIVE',
  onSelectStatus,
  goalsLoading = false,
  showCompleted,
  onShowCompletedChange,
  dueDateFilter,
  setDueDateFilter,
  durationFilter,
  setDurationFilter,
  customDateStart,
  setCustomDateStart,
  customDateEnd,
  setCustomDateEnd,
  customDurationMin,
  setCustomDurationMin,
  customDurationMax,
  setCustomDurationMax,
  searchQuery,
  onSearchQueryChange,
  hasActiveFilters,
  onResetFilters,
  goalsSidebarCollapsed = false,
  onToggleGoalsSidebar,
  className,
  sortKey,
  onSortChange
}: TasksViewProps) {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <GoalSlotSpinner size="md" />
      </div>
    )
  }

  if (!hasSelectedGoal) {
    return (
      <div className="p-4 sm:p-6">
        <div className="px-0 sm:px-2 md:-ml-[3px] md:px-0">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center font-mono text-sm text-gray-600 shadow-sm sm:p-6 sm:text-base">
            Select a goal to view tasks.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="px-4 py-3 sm:px-5 sm:py-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            {goalsSidebarCollapsed && onToggleGoalsSidebar ? (
              <button
                type="button"
                onClick={onToggleGoalsSidebar}
                className="mt-0.5 hidden h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-primary px-2.5 text-[10px] font-semibold uppercase text-zinc-900 shadow-sm transition-colors hover:bg-[#dfb90c] md:inline-flex"
                aria-label="Expand goals sidebar"
                title="Show goals sidebar"
              >
                <PanelLeft className="h-3.5 w-3.5" />
                <span>Goals</span>
              </button>
            ) : null}
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Execute
              </div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-zinc-900 sm:text-xl">
                Tasks
              </h1>
              <p className="mt-0.5 text-xs leading-snug text-zinc-500">
                Capture, prioritise, and ship the work that moves your goals.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 shadow-sm">
              <button
                onClick={() => setViewMode('board')}
                className={cn(
                  'rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  viewMode === 'board'
                    ? 'bg-[#f2cc0d] text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900',
                )}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  viewMode === 'list'
                    ? 'bg-[#f2cc0d] text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900',
                )}
              >
                List
              </button>
            </div>
            <button
              onClick={onCreate}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {onSelectGoal && onSelectStatus ? (
          <div className="mb-2 md:hidden">
            <GoalsSidebarMobile
              goals={goals}
              selectedGoalId={selectedGoalId}
              onSelectGoal={onSelectGoal}
              selectedStatus={selectedStatus}
              onSelectStatus={onSelectStatus}
              isLoading={goalsLoading}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            {/* Search */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && searchQuery) {
                  e.preventDefault()
                  onSearchQueryChange('')
                }
              }}
              className="h-8 w-44 rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] sm:w-56"
            />
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex h-8 items-center gap-2 rounded-sm border border-zinc-200 bg-white px-2 text-[10px] font-bold uppercase shadow-sm md:hidden">
                  <SlidersHorizontal className="h-3 w-3" />
                  Filters
                  {hasActiveFilters ? <span className="ml-1 h-1.5 w-1.5 rounded-full bg-red-500" /> : null}
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[85svh] overflow-y-auto border-t border-zinc-200 bg-[#fafafa]"
              >
                <SheetHeader className="text-left">
                  <SheetTitle className="font-display text-sm font-bold uppercase text-zinc-900">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <TasksAdvancedFilters
                    dueDateFilter={dueDateFilter}
                    setDueDateFilter={setDueDateFilter}
                    durationFilter={durationFilter}
                    setDurationFilter={setDurationFilter}
                    customDateStart={customDateStart}
                    setCustomDateStart={setCustomDateStart}
                    customDateEnd={customDateEnd}
                    setCustomDateEnd={setCustomDateEnd}
                    customDurationMin={customDurationMin}
                    setCustomDurationMin={setCustomDurationMin}
                    customDurationMax={customDurationMax}
                    setCustomDurationMax={setCustomDurationMax}
                    showReset={hasActiveFilters}
                    onReset={onResetFilters}
                    variant="stacked"
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Filters Row (inline on md+) */}
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            <TasksAdvancedFilters
              dueDateFilter={dueDateFilter}
              setDueDateFilter={setDueDateFilter}
              durationFilter={durationFilter}
              setDurationFilter={setDurationFilter}
              customDateStart={customDateStart}
              setCustomDateStart={setCustomDateStart}
              customDateEnd={customDateEnd}
              setCustomDateEnd={setCustomDateEnd}
              customDurationMin={customDurationMin}
              setCustomDurationMin={setCustomDurationMin}
              customDurationMax={customDurationMax}
              setCustomDurationMax={setCustomDurationMax}
              showReset={hasActiveFilters}
              onReset={onResetFilters}
              variant="inline"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* sort functionality for the tasks */}
            <Select value={sortKey} onValueChange={(v) => onSortChange(v as TaskSort)}>
              <SelectTrigger className="h-8 w-[150px] rounded-md border-zinc-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TasksFilters showCompleted={showCompleted} onShowCompletedChange={onShowCompletedChange} />
            {viewMode === 'board' && (
              <span className="hidden rounded-md border border-dashed border-zinc-300 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500 lg:inline">
                Drag to reorder
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {viewMode === 'board' ? (
          <TaskBoard tasks={tasks} onEdit={onEdit} onComplete={onComplete} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <CompactTaskList tasks={tasks} groupBy="status" onEdit={onEdit} onComplete={onComplete} />
          </div>
        )}
      </div>
    </div>
  )
}
