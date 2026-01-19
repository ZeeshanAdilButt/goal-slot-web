'use client'

import { useMemo, useState } from 'react'

import { CompactTaskList } from '@/features/tasks/components/compact-task-list'
import { GoalsSidebarMobile } from '@/features/tasks/components/goals-sidebar/goals-sidebar-mobile'
import { TaskBoard } from '@/features/tasks/components/task-board'
import { TaskList } from '@/features/tasks/components/task-list'
import { TasksAdvancedFilters } from '@/features/tasks/components/tasks-advanced-filters'
import { TasksFilters } from '@/features/tasks/components/tasks-filters'
import { Goal, GroupBy, Task } from '@/features/tasks/utils/types'
import {
  addDays,
  addWeeks,
  endOfWeek,
  getWeek,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { Plus, SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { Input } from '@/components/ui/input'
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
  className,
}: TasksViewProps) {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [compactView, setCompactView] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  const [groupBy, setGroupBy] = useState<GroupBy>('status')
  const [dueDateFilter, setDueDateFilter] = useLocalStorage<string>('tasks-due-date-filter', 'all')
  const [durationFilter, setDurationFilter] = useLocalStorage<string>('tasks-duration-filter', 'all')
  const [searchQuery, setSearchQuery] = useState('')

  // Custom date filter state
  const [customDateStart, setCustomDateStart] = useLocalStorage('tasks-custom-date-start', '')
  const [customDateEnd, setCustomDateEnd] = useLocalStorage('tasks-custom-date-end', '')

  // Custom duration filter state (in minutes)
  const [customDurationMin, setCustomDurationMin] = useLocalStorage<number | ''>('tasks-custom-duration-min', '')
  const [customDurationMax, setCustomDurationMax] = useLocalStorage<number | ''>('tasks-custom-duration-max', '')
  const hasActiveFilters = dueDateFilter !== 'all' || durationFilter !== 'all' || searchQuery.length > 0
  const resetFilters = () => {
    setDueDateFilter('all')
    setDurationFilter('all')
    setSearchQuery('')
    setCustomDateStart('')
    setCustomDateEnd('')
    setCustomDurationMin('')
    setCustomDurationMax('')
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(query)
        const matchesDesc = task.description?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesDesc) return false
      }

      // Due Date Filter
      if (dueDateFilter !== 'all') {
        if (dueDateFilter === 'no_date') {
          if (task.dueDate) return false
        } else if (dueDateFilter === 'custom') {
          // Custom date range filter
          if (!task.dueDate) return false
          const taskDate = startOfDay(new Date(task.dueDate))

          if (customDateStart && customDateEnd) {
            const start = startOfDay(new Date(customDateStart))
            const end = startOfDay(new Date(customDateEnd))
            if (!isWithinInterval(taskDate, { start, end })) return false
          } else if (customDateStart) {
            const start = startOfDay(new Date(customDateStart))
            if (isBefore(taskDate, start)) return false
          } else if (customDateEnd) {
            const end = startOfDay(new Date(customDateEnd))
            if (isAfter(taskDate, end)) return false
          }
        } else if (dueDateFilter === 'next_week') {
          if (!task.dueDate) return false
          const date = new Date(task.dueDate)
          const today = startOfDay(new Date())
          const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
          const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
          if (!isWithinInterval(date, { start: nextWeekStart, end: nextWeekEnd })) return false
        } else if (task.dueDate) {
          const date = new Date(task.dueDate)
          const today = startOfDay(new Date())

          if (dueDateFilter === 'overdue') {
            if (!isBefore(date, today)) return false
          } else if (dueDateFilter === 'today') {
            if (!isSameDay(date, today)) return false
          } else if (dueDateFilter === 'tomorrow') {
            if (!isSameDay(date, addDays(today, 1))) return false
          } else if (dueDateFilter === 'week') {
            // Check if same ISO week
            const taskWeek = getWeek(date)
            const currentWeek = getWeek(today)
            if (taskWeek !== currentWeek) return false
          }
        } else {
          // If filtering by specific date criteria but task has no date
          return false
        }
      }

      // Duration Filter
      if (durationFilter !== 'all') {
        const minutes = task.estimatedMinutes || 0

        if (durationFilter === 'custom') {
          // Custom duration range
          if (customDurationMin !== '' && minutes < customDurationMin) return false
          if (customDurationMax !== '' && minutes > customDurationMax) return false
          // If no estimate and we have min filter, exclude
          if (customDurationMin !== '' && !task.estimatedMinutes) return false
        } else if (durationFilter === 'short') {
          // < 30m
          if (minutes === 0 || minutes >= 30) return false
        } else if (durationFilter === 'medium') {
          // 30m - 2h
          if (minutes < 30 || minutes > 120) return false
        } else if (durationFilter === 'long') {
          // > 2h
          if (minutes <= 120) return false
        } else if (durationFilter === 'no_estimate') {
          if (task.estimatedMinutes) return false
        }
      }

      return true
    })
  }, [
    tasks,
    dueDateFilter,
    durationFilter,
    searchQuery,
    customDateStart,
    customDateEnd,
    customDurationMin,
    customDurationMax,
  ])

  const visibleTasks = useMemo(() => {
    if (showCompleted) return filteredTasks
    return filteredTasks.filter((task) => task.status !== 'DONE')
  }, [filteredTasks, showCompleted])

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
          <h1 className="font-display text-2xl font-bold uppercase sm:text-3xl md:text-4xl">Tasks</h1>
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
            <button
              onClick={onCreate}
              className="btn-brutal flex items-center gap-2 px-3 py-2 text-sm sm:px-4 sm:py-2 md:px-6 md:py-3 md:text-base"
            >
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                      onReset={resetFilters}
                      variant="stacked"
                    />
                  </div>

                  {viewMode === 'list' ? (
                    <div className="mt-6">
                      <div className="mb-2 text-xs font-bold uppercase text-secondary">List options</div>
                      <TasksFilters
                        compactView={compactView}
                        onCompactViewChange={setCompactView}
                        showCompleted={showCompleted}
                        onShowCompletedChange={setShowCompleted}
                        groupBy={groupBy}
                        onGroupByChange={setGroupBy}
                      />
                    </div>
                  ) : null}
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
                onReset={resetFilters}
                variant="inline"
              />
            </div>
          </div>

          {viewMode === 'board' ? (
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-secondary/70">
              <button
                onClick={() => setShowCompleted((prev) => !prev)}
                className={`h-8 rounded-sm border-2 px-3 shadow-brutal-sm transition ${
                  showCompleted
                    ? 'border-secondary bg-secondary text-white'
                    : 'border-secondary bg-white text-secondary'
                }`}
              >
                {showCompleted ? 'Hide completed' : 'Show completed'}
              </button>
              <span className="rounded-sm border border-dashed border-secondary/40 px-2 py-1">
                Drag tasks to reorder
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {viewMode === 'board' ? (
          <TaskBoard tasks={visibleTasks} onEdit={onEdit} onComplete={onComplete} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="hidden px-2 md:-ml-[3px] md:block md:px-0">
              <TasksFilters
                compactView={compactView}
                onCompactViewChange={setCompactView}
                showCompleted={showCompleted}
                onShowCompletedChange={setShowCompleted}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
              />
            </div>
            {compactView ? (
              <CompactTaskList tasks={visibleTasks} groupBy={groupBy} onEdit={onEdit} onComplete={onComplete} />
            ) : (
              <TaskList tasks={visibleTasks} groupBy={groupBy} onEdit={onEdit} onComplete={onComplete} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
