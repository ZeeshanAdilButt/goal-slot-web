'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { sortTasks, isTaskSort } from '@/features/tasks/utils/sort-tasks'
import { CompleteTaskModal } from '@/features/tasks/components/complete-task-modal'
import { CreateTaskModal } from '@/features/tasks/components/create-task-modal'
import { GoalsSidebar } from '@/features/tasks/components/goals-sidebar'
import { WITHOUT_GOALS_ID } from '@/features/tasks/components/goals-sidebar/types'
import { TasksView } from '@/features/tasks/components/tasks-view'
import { useTasks } from '@/features/tasks/hooks/use-tasks'
import {
  useCompleteTaskMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks/use-tasks-mutations'
import { CreateTaskForm, Task, TaskStatus } from '@/features/tasks/utils/types'
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

import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/use-local-storage'

export function TasksPage() {
  const { tasks, scheduleBlocks, goals, isLoading, goalStatus, setGoalStatus } = useTasks()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const focusedTaskId = searchParams?.get('taskId') ?? null

  const createTaskMutation = useCreateTaskMutation()
  const updateTaskMutation = useUpdateTaskMutation()
  const completeTaskMutation = useCompleteTaskMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)

  const [selectedGoalId, setSelectedGoalId, isGoalIdInitialized] = useLocalStorage<string | null>(
    'tasks-selected-goal-id',
    null,
  )
  const [dueDateFilter, setDueDateFilter] = useLocalStorage<string>('tasks-due-date-filter', 'all')
  const [durationFilter, setDurationFilter] = useLocalStorage<string>('tasks-duration-filter', 'all')
  const [customDateStart, setCustomDateStart] = useLocalStorage('tasks-custom-date-start', '')
  const [customDateEnd, setCustomDateEnd] = useLocalStorage('tasks-custom-date-end', '')
  const [customDurationMin, setCustomDurationMin] = useLocalStorage<number | ''>('tasks-custom-duration-min', '')
  const [customDurationMax, setCustomDurationMax] = useLocalStorage<number | ''>('tasks-custom-duration-max', '')
  const [sortKey, setSortKey] = useLocalStorage<string>('goalslot.tasks.sort', 'newest')

  const [isGoalsSidebarCollapsed, setIsGoalsSidebarCollapsed, isGoalsSidebarInitialized] = useLocalStorage(
    'tasks-goals-sidebar-collapsed',
    false,
  )

  // Schedule-aware bucketing for the goals sidebar. For each linked goal:
  //   activeGoalIdsThisWeek: a block is happening RIGHT NOW
  //   upcomingTodayIds: a block starts later today (and none active now)
  //   pastTodayIds: had at least one block today, none upcoming, none now
  //   goalNextBlockMinutes: minutes until next occurrence (rolling 7-day);
  //     used to sort within Upcoming Today + Later This Week buckets.
  const {
    activeGoalIdsThisWeek,
    upcomingTodayIds,
    pastTodayIds,
    goalNextBlockMinutes,
  } = useMemo(() => {
    const active = new Set<string>()
    const upcomingToday = new Set<string>()
    const hadToday = new Set<string>()
    const nextMins = new Map<string, number>()
    const now = new Date()
    const todayDow = now.getDay()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const parseHM = (s: string | null | undefined): number | null => {
      if (!s) return null
      const [h, m] = s.split(':').map(Number)
      if (Number.isNaN(h) || Number.isNaN(m)) return null
      return h * 60 + m
    }
      ; (scheduleBlocks ?? []).forEach(
        (b: {
          goalId?: string | null
          dayOfWeek?: number | null
          startTime?: string | null
          endTime?: string | null
        }) => {
          if (!b.goalId || typeof b.dayOfWeek !== 'number') return
          const start = parseHM(b.startTime)
          const end = parseHM(b.endTime)
          if (start == null || end == null) return
          if (b.dayOfWeek === todayDow) {
            hadToday.add(b.goalId)
            if (nowMinutes >= start && nowMinutes < end) {
              active.add(b.goalId)
              nextMins.set(b.goalId, 0)
              return
            }
            if (start > nowMinutes) {
              upcomingToday.add(b.goalId)
            }
          }
          let daysUntil = (b.dayOfWeek - todayDow + 7) % 7
          let blockNow = daysUntil * 1440 + start - nowMinutes
          if (blockNow < 0) blockNow += 7 * 1440
          const prev = nextMins.get(b.goalId)
          if (prev === undefined || blockNow < prev) nextMins.set(b.goalId, blockNow)
        },
      )
    // Past today = had a block today, but no more upcoming today and not active.
    const past = new Set<string>()
    hadToday.forEach((id) => {
      if (!active.has(id) && !upcomingToday.has(id)) past.add(id)
    })
    return {
      activeGoalIdsThisWeek: active,
      upcomingTodayIds: upcomingToday,
      pastTodayIds: past,
      goalNextBlockMinutes: nextMins,
    }
  }, [scheduleBlocks])

  // Deep-link support for ?taskId=<id>. When a user clicks the task name
  // in the top bar timer or in a recent time entry, we land here. Find the
  // task, switch the goals sidebar to its goal (so the row is visible),
  // open the edit modal, then strip the query param so a refresh doesn't
  // re-open the modal.
  useEffect(() => {
    if (!focusedTaskId || isLoading) return
    const task = tasks.find((t) => t.id === focusedTaskId)
    if (!task) {
      // Tasks haven't streamed in yet, or the task was deleted. Wait one
      // more render; if tasks are loaded and we still can't find it, drop
      // the param so the URL doesn't stay stuck.
      if (tasks.length > 0) {
        router.replace(pathname || '/dashboard/tasks', { scroll: false })
      }
      return
    }
    setSelectedGoalId(task.goalId ?? WITHOUT_GOALS_ID)
    setEditingTask(task)
    router.replace(pathname || '/dashboard/tasks', { scroll: false })
  }, [focusedTaskId, tasks, isLoading, router, pathname, setSelectedGoalId])

  // Auto-select first goal when goals change
  useEffect(() => {
    if (!isGoalIdInitialized || isLoading) return

    // Don't auto-select if "Without Goals" is selected
    if (selectedGoalId === WITHOUT_GOALS_ID) return

    if (goals.length > 0) {
      const isValid = selectedGoalId && goals.some((g) => g.id === selectedGoalId)
      if (!isValid) {
        setSelectedGoalId(goals[0].id)
      }
    } else if (goals.length === 0) {
      if (selectedGoalId !== null && selectedGoalId !== WITHOUT_GOALS_ID) setSelectedGoalId(null)
    }
  }, [goals, selectedGoalId, isGoalIdInitialized, isLoading, setSelectedGoalId])

  // Filter tasks for selected goal
  const tasksForGoal = useMemo(
    () =>
      selectedGoalId === WITHOUT_GOALS_ID
        ? tasks.filter((t) => t.goalId === null)
        : selectedGoalId
          ? tasks.filter((t) => t.goalId === selectedGoalId)
          : [],
    [selectedGoalId, tasks],
  )

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
    return tasksForGoal.filter((task) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(query)
        const matchesDesc = task.description?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesDesc) return false
      }

      if (dueDateFilter !== 'all') {
        if (dueDateFilter === 'no_date') {
          if (task.dueDate) return false
        } else if (dueDateFilter === 'custom') {
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
            const taskWeek = getWeek(date)
            const currentWeek = getWeek(today)
            if (taskWeek !== currentWeek) return false
          }
        } else {
          return false
        }
      }

      if (durationFilter !== 'all') {
        const minutes = task.estimatedMinutes || 0

        if (durationFilter === 'custom') {
          if (customDurationMin !== '' && minutes < customDurationMin) return false
          if (customDurationMax !== '' && minutes > customDurationMax) return false
          if (customDurationMin !== '' && !task.estimatedMinutes) return false
        } else if (durationFilter === 'short') {
          if (minutes === 0 || minutes >= 30) return false
        } else if (durationFilter === 'medium') {
          if (minutes < 30 || minutes > 120) return false
        } else if (durationFilter === 'long') {
          if (minutes <= 120) return false
        } else if (durationFilter === 'no_estimate') {
          if (task.estimatedMinutes) return false
        }
      }

      return true
    })
  }, [
    tasksForGoal,
    searchQuery,
    dueDateFilter,
    durationFilter,
    customDateStart,
    customDateEnd,
    customDurationMin,
    customDurationMax,
  ])

  const sortedTasks = useMemo(
    () => sortTasks(filteredTasks, isTaskSort(sortKey) ? sortKey : 'newest'),
    [filteredTasks, sortKey],
  )

  const visibleTasks = useMemo(() => {
    if (showCompleted) return sortedTasks
    return sortedTasks.filter((task) => task.status !== 'DONE')
  }, [sortedTasks, showCompleted])

  const createTask = async (form: CreateTaskForm) => {
    try {
      await createTaskMutation.mutateAsync(form)
      return true
    } catch {
      return false
    }
  }

  const updateTask = async (taskId: string, form: CreateTaskForm & { status?: TaskStatus }) => {
    try {
      await updateTaskMutation.mutateAsync({ taskId, data: form })
      return true
    } catch {
      return false
    }
  }

  const completeTask = async (taskId: string, minutes: number, notes?: string) => {
    try {
      await completeTaskMutation.mutateAsync({ taskId, minutes, notes })
      return true
    } catch {
      return false
    }
  }

  const goalsSidebarCollapsed = isGoalsSidebarInitialized ? isGoalsSidebarCollapsed : true
  const shouldAnimateLayout = isGoalsSidebarInitialized

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col gap-0 md:grid md:grid-rows-[minmax(0,1fr)]',
        shouldAnimateLayout && 'transition-[grid-template-columns] duration-200 ease-linear',
      )}
      style={{
        gridTemplateColumns: goalsSidebarCollapsed ? '0px minmax(0,1fr)' : '16rem minmax(0,1fr)',
      }}
    >
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden overflow-hidden md:block transition-[opacity] duration-200 ease-linear',
          goalsSidebarCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100',
        )}
        aria-hidden={goalsSidebarCollapsed}
      >
        <GoalsSidebar
          goals={goals}
          selectedGoalId={selectedGoalId}
          onSelectGoal={setSelectedGoalId}
          selectedStatus={goalStatus}
          onSelectStatus={setGoalStatus}
          isLoading={isLoading}
          isCollapsed={goalsSidebarCollapsed}
          onToggleCollapse={() => setIsGoalsSidebarCollapsed((prev) => !prev)}
          activeGoalIds={activeGoalIdsThisWeek}
          upcomingTodayIds={upcomingTodayIds}
          pastTodayIds={pastTodayIds}
          goalNextBlockMinutes={goalNextBlockMinutes}
        />
      </div>

      <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col">
          <TasksView
            className="min-h-0 flex-1"
            tasks={visibleTasks}
            onComplete={setCompletingTask}
            onEdit={setEditingTask}
            onCreate={() => setShowCreate(true)}
            hasSelectedGoal={!!selectedGoalId}
            isLoading={isLoading}
            goals={goals}
            selectedGoalId={selectedGoalId}
            onSelectGoal={setSelectedGoalId}
            selectedStatus={goalStatus}
            onSelectStatus={setGoalStatus}
            goalsLoading={isLoading}
            showCompleted={showCompleted}
            onShowCompletedChange={setShowCompleted}
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
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
            goalsSidebarCollapsed={goalsSidebarCollapsed}
            sortKey={isTaskSort(sortKey) ? sortKey : 'newest'}
            onSortChange={setSortKey}
            onToggleGoalsSidebar={() => setIsGoalsSidebarCollapsed((prev) => !prev)}
          />

          <CreateTaskModal
            isOpen={showCreate}
            onClose={() => setShowCreate(false)}
            onSubmit={createTask}
            scheduleBlocks={scheduleBlocks}
            goals={goals}
            {...(selectedGoalId && selectedGoalId !== WITHOUT_GOALS_ID ? { defaultGoalId: selectedGoalId } : {})}
          />

          <CreateTaskModal
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            onSubmit={async (form) => {
              if (editingTask) {
                const success = await updateTask(editingTask.id, form)
                if (success) {
                  setEditingTask(null)
                }
                return success
              }
              return false
            }}
            scheduleBlocks={scheduleBlocks}
            goals={goals}
            task={editingTask}
          />

          <CompleteTaskModal task={completingTask} onClose={() => setCompletingTask(null)} onConfirm={completeTask} />
        </div>
      </main>
    </div>
  )
}
