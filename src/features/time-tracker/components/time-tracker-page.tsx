'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDuration } from '@/lib/utils'

import { useTimeTrackerData } from '../hooks/use-time-tracker-queries'
import { useCreateTimeEntry } from '../hooks/use-time-tracker-mutations'
import { useTimer } from '../hooks/use-timer'

import { TimerDisplay } from './timer-display'
import { TimerControls } from './timer-controls'
import { TaskSelector } from './task-selector'
import { TimerSettings } from './timer-settings'
import { StatsCards } from './stats-cards'
import { RecentEntries } from './recent-entries'
import { ManualEntryModal } from './manual-entry-modal'

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
  const [showManualEntry, setShowManualEntry] = useState(false)

  const startTimer = () => {
    const selectedTaskTitle = currentTaskId
      ? tasks.find((t) => t.id === currentTaskId)?.title
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
    if (elapsedTime < 60) {
      toast.error('Minimum duration is 1 minute')
      return
    }

    const duration = Math.floor(elapsedTime / 60)
    const taskTitle = currentTaskId
      ? tasks.find((t) => t.id === currentTaskId)?.title || currentTask
      : currentTask

    createEntry.mutate(
      {
        taskName: taskTitle,
        taskId: currentTaskId || undefined,
        taskTitle,
        duration,
        date: new Date().toISOString().split('T')[0],
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Time Tracker</h1>
          <p className="font-mono uppercase text-gray-600">Track time with precision</p>
        </div>

        <button onClick={() => setShowManualEntry(true)} className="btn-brutal flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Manual Entry
        </button>
      </div>

      {/* Timer Section */}
      <motion.div
        className="card-brutal-colored bg-secondary p-8 text-white"
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
          onTaskIdChange={(id) => {
            setTaskId(id)
            const title = tasks.find((t) => t.id === id)?.title || ''
            setTask(title)
          }}
          onTaskTitleChange={(title) => {
            setTask(title)
            setTaskId('')
          }}
        />

        <TimerSettings
          goals={goals}
          currentCategory={currentCategory}
          currentGoalId={currentGoalId}
          timerState={timerState}
          onCategoryChange={setCategory}
          onGoalIdChange={setGoalId}
        />

        <TimerDisplay elapsedTime={elapsedTime} timerState={timerState} />

        <TimerControls
          timerState={timerState}
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
