'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { ManualEntryModal } from '@/features/time-tracker/components/manual-entry-modal'
import { RecentEntries } from '@/features/time-tracker/components/recent-entries'
import { StatsCards } from '@/features/time-tracker/components/stats-cards'
import { StopTimerModal } from '@/features/time-tracker/components/stop-timer-modal'
import { TaskSelector } from '@/features/time-tracker/components/task-selector'
import { TimerControls } from '@/features/time-tracker/components/timer-controls'
import { TimerDisplay } from '@/features/time-tracker/components/timer-display'
import { TimerSettings } from '@/features/time-tracker/components/timer-settings'
import { useCreateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import { useTimer } from '@/features/time-tracker/hooks/use-timer'
import { findScheduleBlockForDateTime } from '@/features/time-tracker/utils/schedule'
import {
  getCategoryFromGoal,
  sortTasksBySelection,
} from '@/features/time-tracker/utils/selection-helpers'
import { Goal, Task } from '@/features/time-tracker/utils/types'
import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-tasks-mutations'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { tasksApi } from '@/lib/api'
import { formatDuration, getLocalDateString } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'

export function TimeTrackerPage() {
  const {
    timerState,
    elapsedTime,
    currentTask,
    currentTaskId,
    currentCategory,
    currentGoalId,
    currentScheduleBlockId,
    setTask,
    setTaskId,
    setCategory,
    setGoalId,
    setScheduleBlockId,
    start,
    pause,
    resume,
    reset,
    setElapsedTime,
    startTimestamp,
  } = useTimer()

  const { goals, tasks, recentEntries, weeklySchedule } = useTimeTrackerData()
  const createEntry = useCreateTimeEntry()
  const updateTask = useUpdateTaskMutation()
  const queryClient = useQueryClient()
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [showStopModal, setShowStopModal] = useState(false)
  const [manualCategory, setManualCategory] = useState(false)
  const [manualGoal, setManualGoal] = useState(false)
  const [manualSchedule, setManualSchedule] = useState(false)

  // Open the Manual Entry modal directly when the user clicked "+ Log time"
  // from the persistent header shortcut (which navigates here with ?action=manual).
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams?.get('action') === 'manual') {
      setShowManualEntry(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!weeklySchedule) return

    const now = new Date()
    const activeBlock = findScheduleBlockForDateTime(weeklySchedule, now)

    if (!activeBlock) {
      if (timerState === 'STOPPED') {
        setScheduleBlockId('')
      }
      return
    }

    if (!manualSchedule && (!currentScheduleBlockId || timerState === 'STOPPED')) {
      setScheduleBlockId(activeBlock.id)
    }

    if (
      !manualGoal &&
      (timerState === 'STOPPED' || !currentGoalId) &&
      activeBlock.goalId &&
      currentGoalId !== activeBlock.goalId
    ) {
      setGoalId(activeBlock.goalId)
      setManualGoal(false)
    }

    if (
      !manualCategory &&
      (timerState === 'STOPPED' || !currentCategory) &&
      activeBlock.category &&
      currentCategory !== activeBlock.category
    ) {
      setCategory(activeBlock.category)
      setManualCategory(false)
    }
  }, [
    weeklySchedule,
    timerState,
    currentScheduleBlockId,
    currentGoalId,
    currentCategory,
    manualSchedule,
    manualGoal,
    manualCategory,
    setScheduleBlockId,
    setGoalId,
    setCategory,
  ])

  const handleCreateTask = async (title: string): Promise<Task | null> => {
    try {
      // Only pre-link to a goal/category when the user has explicitly chosen
      // them. The schedule-block auto-bind sets currentGoalId silently from
      // whatever block is active right now, and inheriting that into a new
      // task created mid-session is what produces "I picked an OloStep task
      // but it's showing Core Engineering Study as the goal" later. Manual
      // picks are tracked via manualGoal / manualCategory.
      const response = await tasksApi.create({
        title,
        goalId: manualGoal && currentGoalId ? currentGoalId : undefined,
        category: manualCategory && currentCategory ? currentCategory : undefined,
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['time-tracker'] })

      toast.success(`Task "${title}" created!`)

      if (response.data.goalId) {
        setGoalId(response.data.goalId)
      }

      return response.data as Task
    } catch (error) {
      toast.error('Failed to create task')
      return null
    }
  }

  const handleTaskChange = (taskId: string) => {
    setTaskId(taskId)
    if (taskId) {
      const task = tasks.find((t: Task) => t.id === taskId)
      if (task) {
        setTask(task.title)
        setManualCategory(true)
        setManualGoal(true)
        setCategory(task.category || '')
        setGoalId(task.goalId || '')
        if (task.scheduleBlockId) {
          setScheduleBlockId(task.scheduleBlockId)
          setManualSchedule(true)
        } else {
          setManualSchedule(false)
        }
      }
    } else {
      setTask('')
    }
  }

  const handleCategoryChange = (category: string) => {
    setCategory(category)
    setManualCategory(true)
  }

  const handleGoalChange = (goalId: string) => {
    setGoalId(goalId)
    setManualGoal(true)
    if (goalId) {
      const goalCategory = getCategoryFromGoal(goalId, goals)
      if (goalCategory) {
        setCategory(goalCategory)
        setManualCategory(true)
      }
    } else {
      setCategory('')
      setManualCategory(true)
      setTaskId('')
      setTask('')
    }
  }

  const orderedTasks = sortTasksBySelection(tasks, currentGoalId || undefined, currentCategory || undefined)

  const filteredGoals = goals.filter((goal: Goal) => {
    if (currentCategory) {
      return goal.category === currentCategory
    }
    return true
  })

  const startTimer = () => {
    const selectedTask = currentTaskId ? tasks.find((t: Task) => t.id === currentTaskId) : undefined
    const selectedTaskTitle = currentTaskId ? selectedTask?.title : currentTask.trim()

    if (!selectedTaskTitle) {
      toast.error('Please select a task or enter a title')
      return
    }

    setTask(selectedTaskTitle)
    setElapsedTime(0)
    const blockForStart = currentScheduleBlockId || findScheduleBlockForDateTime(weeklySchedule, new Date())?.id || ''
    setScheduleBlockId(blockForStart)
    start(selectedTaskTitle, currentTaskId, currentCategory, currentGoalId, blockForStart)

    if (selectedTask && selectedTask.status === 'BACKLOG') {
      updateTask.mutate(
        { taskId: selectedTask.id, data: { status: 'DOING' } },
        {
          onError: (error) => {
            console.error('Failed to update task status:', error)
            toast.error('Could not update task status, but timer started successfully')
          },
        },
      )
    }
  }

  const pauseTimer = () => {
    pause(elapsedTime)
  }

  const resumeTimer = () => {
    resume()
  }

  const stopTimer = async () => {
    setShowStopModal(true)
  }

  const handleStopConfirm = (notes: string) => {
    const duration = Math.max(1, Math.floor(elapsedTime / 60))
    const taskTitle = currentTaskId
      ? tasks.find((t: Task) => t.id === currentTaskId)?.title || currentTask
      : currentTask

    createEntry.mutate(
      {
        taskName: taskTitle,
        taskId: currentTaskId || undefined,
        taskTitle,
        duration,
        date: getLocalDateString(),
        notes: notes || undefined,
        goalId: currentGoalId || undefined,
        startedAt: startTimestamp ? new Date(startTimestamp).toISOString() : undefined,
        scheduleBlockId: currentScheduleBlockId || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Logged ${formatDuration(duration)}!`)
          setElapsedTime(0)
          reset()
          setShowStopModal(false)
        },
      },
    )
  }

  const resetTimer = () => {
    setElapsedTime(0)
    reset()
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Focus"
        title="Time Tracker"
        description="Track time with precision"
        actions={
          <Button onClick={() => setShowManualEntry(true)} variant="brand">
            <Plus className="h-4 w-4" />
            Manual Entry
          </Button>
        }
      />

      <GlassCard className="timer-glow text-center p-5 sm:p-6">
        <TaskSelector
          tasks={orderedTasks}
          currentTaskId={currentTaskId}
          currentTask={currentTask}
          timerState={timerState}
          onTaskIdChange={handleTaskChange}
          onTaskTitleChange={setTask}
          onCreateTask={handleCreateTask}
          variant="light"
        />
        <TimerSettings
          goals={filteredGoals}
          currentCategory={currentCategory}
          currentGoalId={currentGoalId}
          timerState={timerState}
          isTaskSelected={!!currentTaskId}
          onCategoryChange={handleCategoryChange}
          onGoalIdChange={handleGoalChange}
        />
        <TimerDisplay elapsedTime={elapsedTime} timerState={timerState} />
        <TimerControls
          timerState={timerState}
          isStopLoading={createEntry.isPending}
          onStart={startTimer}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onStop={stopTimer}
          onReset={resetTimer}
        />
      </GlassCard>

      <StatsCards recentEntries={recentEntries} />

      <RecentEntries />

      <ManualEntryModal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        goals={goals}
        tasks={tasks}
        weeklySchedule={weeklySchedule}
      />

      <StopTimerModal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        onConfirm={handleStopConfirm}
        taskName={currentTask || 'Untitled'}
        duration={Math.max(1, Math.floor(elapsedTime / 60))}
        isLoading={createEntry.isPending}
      />
    </PageShell>
  )
}
