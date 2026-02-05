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
  className?: string
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
          <div className="card-brutal p-4 text-center font-mono text-sm text-gray-600 sm:p-6 sm:text-base">
            Select a goal to view tasks.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {goalsSidebarCollapsed && onToggleGoalsSidebar ? (
              <button
                type="button"
                onClick={onToggleGoalsSidebar}
                className="hidden h-9 items-center gap-2 border-3 border-secondary bg-primary px-3 text-[10px] font-bold uppercase text-secondary shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-hover active:translate-x-1 active:translate-y-1 active:shadow-none md:inline-flex"
                aria-label="Expand goals sidebar"
                title="Show goals sidebar"
              >
                <PanelLeft className="h-4 w-4" />
                <span>Goals</span>
              </button>
            ) : null}
            <h1 className="font-display text-2xl font-bold uppercase sm:text-3xl md:text-4xl">Tasks</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border-3 border-secondary bg-white shadow-brutal-sm">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-2 text-[10px] font-bold uppercase transition-colors sm:px-4 sm:text-xs ${
                  viewMode === 'board' ? 'bg-primary text-secondary' : 'hover:bg-gray-100'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-[10px] font-bold uppercase transition-colors sm:px-4 sm:text-xs ${
                  viewMode === 'list' ? 'bg-primary text-secondary' : 'hover:bg-gray-100'
                }`}
              >
                List
              </button>
            </div>
            <button onClick={onCreate} className="btn-brutal flex items-center">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="h-8 w-full flex-1 rounded-sm border-2 border-secondary bg-white px-3 text-xs font-bold uppercase placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 sm:w-48"
              />
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex h-8 items-center gap-2 rounded-sm border-2 border-secondary bg-white px-2 text-[10px] font-bold uppercase shadow-brutal-sm md:hidden">
                    <SlidersHorizontal className="h-3 w-3" />
                    Filters
                    {hasActiveFilters ? <span className="ml-1 h-1.5 w-1.5 rounded-full bg-red-500" /> : null}
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[85svh] overflow-y-auto border-t-3 border-secondary bg-brutalist-bg"
                >
                  <SheetHeader className="text-left">
                    <SheetTitle className="font-display text-sm font-bold uppercase text-secondary">Filters</SheetTitle>
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

            {/* Filters Row */}
            <div className="hidden md:flex">
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
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-secondary/70">
            <TasksFilters showCompleted={showCompleted} onShowCompletedChange={onShowCompletedChange} />
            {viewMode === 'board' ? (
              <span className="rounded-sm border border-dashed border-secondary/40 px-2 py-1">
                Drag tasks to reorder
              </span>
            ) : null}
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
