'use client'

import { useState } from 'react'

import { ManualEntryModal } from '@/features/time-tracker/components/manual-entry-modal'
import { RecentEntries } from '@/features/time-tracker/components/recent-entries'
import { StatsCards } from '@/features/time-tracker/components/stats-cards'
import { TaskSelector } from '@/features/time-tracker/components/task-selector'
import { TimerControls } from '@/features/time-tracker/components/timer-controls'
import { TimerDisplay } from '@/features/time-tracker/components/timer-display'
import { TimerSettings } from '@/features/time-tracker/components/timer-settings'
import { useCreateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import { useTimer } from '@/features/time-tracker/hooks/use-timer'
import { Task } from '@/features/time-tracker/utils/types'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { tasksApi } from '@/lib/api'
import { formatDuration, getLocalDateString } from '@/lib/utils'

export function TimeTrackerPage() {
  const {
    timerState,
    elapsedTime,
    currentTask,
    currentTaskId,
    currentCategory,
    currentGoalId,
    setTask,
    setTaskId,
    setCategory,
    setGoalId,
    start,
    pause,
    resume,
    reset,
    setElapsedTime,
    startTimestamp,
  } = useTimer()

  const { goals, tasks, recentEntries, isLoading } = useTimeTrackerData()
  const createEntry = useCreateTimeEntry()
  const queryClient = useQueryClient()
  const [showManualEntry, setShowManualEntry] = useState(false)

  const handleCreateTask = async (title: string): Promise<Task | null> => {
    try {
      // Create task with current goal if one is selected
      const response = await tasksApi.create({
        title,
        goalId: currentGoalId || undefined,
        category: currentCategory || undefined,
      })

      // Invalidate tasks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['time-tracker'] })

      toast.success(`Task "${title}" created!`)

      // Set the goal if the task has one
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
        if (task.category) setCategory(task.category)
        if (task.goalId) setGoalId(task.goalId)
      }
    } else {
      setTask('')
      // Don't reset category/goal as user might want to set them manually
    }
  }

  const startTimer = () => {
    const selectedTaskTitle = currentTaskId
      ? tasks.find((t: Task) => t.id === currentTaskId)?.title
      : currentTask.trim()

    if (!selectedTaskTitle) {
      toast.error('Please select a task or enter a title')
      return
    }

    setTask(selectedTaskTitle)
    setElapsedTime(0)
    start(selectedTaskTitle, currentCategory, currentGoalId)
  }

  const pauseTimer = () => {
    pause(elapsedTime)
  }

  const resumeTimer = () => {
    resume()
  }

  const stopTimer = async () => {
    const duration = Math.max(1, Math.floor(elapsedTime / 60)) // At least 1 minute for the entry
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
        notes: `Timer session`,
        goalId: currentGoalId || undefined,
        startedAt: startTimestamp ? new Date(startTimestamp).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Logged ${formatDuration(duration)}!`)
          setElapsedTime(0)
          reset()
        },
      },
    )
  }

  const resetTimer = () => {
    setElapsedTime(0)
    reset()
  }

  return (
    <div className="space-y-4 p-2 sm:space-y-6 sm:p-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase sm:text-3xl md:text-4xl">Time Tracker</h1>
          <p className="font-mono text-sm uppercase text-gray-600 sm:text-base">Track time with precision</p>
        </div>

        <button onClick={() => setShowManualEntry(true)} className="btn-brutal flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Manual Entry
        </button>
      </div>

      {/* Timer Section */}
      <motion.div
        className="card-brutal-colored bg-secondary p-4 text-white sm:p-6 md:p-8"
        animate={
          timerState === 'RUNNING'
            ? {
                boxShadow: [
                  '8px 8px 0 0 rgba(250,204,21,1)',
                  '12px 12px 0 0 rgba(250,204,21,1)',
                  '8px 8px 0 0 rgba(250,204,21,1)',
                ],
              }
            : {}
        }
        transition={{ duration: 1, repeat: timerState === 'RUNNING' ? Infinity : 0 }}
      >
        <TaskSelector
          tasks={tasks}
          currentTaskId={currentTaskId}
          currentTask={currentTask}
          timerState={timerState}
          onTaskIdChange={handleTaskChange}
          onTaskTitleChange={setTask}
          onCreateTask={handleCreateTask}
        />
        <TimerSettings
          goals={goals}
          currentCategory={currentCategory}
          currentGoalId={currentGoalId}
          timerState={timerState}
          isTaskSelected={!!currentTaskId}
          onCategoryChange={setCategory}
          onGoalIdChange={setGoalId}
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
      </motion.div>

      <StatsCards recentEntries={recentEntries} />

      <RecentEntries recentEntries={recentEntries} isLoading={isLoading} />

      <ManualEntryModal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        goals={goals}
        tasks={tasks}
      />
    </div>
  )
}
