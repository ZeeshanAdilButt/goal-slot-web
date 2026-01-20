'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Clock3, Pause, Timer, Bell, Square, Play } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useTimerStore } from '@/lib/use-timer-store'
import { useTimerNotifications } from '@/hooks/use-timer-notifications'
import { useCreateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { formatDuration, getLocalDateString } from '@/lib/utils'

const formatTimerDisplay = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function TimeEntryBanner() {
  const {
    timerState,
    currentTask,
    currentTaskId,
    currentCategory,
    currentGoalId,
    currentScheduleBlockId,
    startTimestamp,
    pausedElapsedTime,
    pause: pauseTimer,
    resume: resumeTimer,
    reset,
  } = useTimerStore((state) => ({
    timerState: state.timerState,
    currentTask: state.currentTask,
    currentTaskId: state.currentTaskId,
    currentCategory: state.currentCategory,
    currentGoalId: state.currentGoalId,
    currentScheduleBlockId: state.currentScheduleBlockId,
    startTimestamp: state.startTimestamp,
    pausedElapsedTime: state.pausedElapsedTime,
    pause: state.pause,
    resume: state.resume,
    reset: state.reset,
  }))
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const { permission, requestPermission } = useTimerNotifications()
  const createEntry = useCreateTimeEntry()

  useEffect(() => {
    if (timerState === 'RUNNING' && startTimestamp) {
      const updateElapsed = () =>
        setElapsedSeconds(Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsedTime)

      updateElapsed()
      const interval = setInterval(updateElapsed, 1000)
      return () => clearInterval(interval)
    } else {
      setElapsedSeconds(pausedElapsedTime)
    }
  }, [timerState, startTimestamp, pausedElapsedTime])

  if (timerState === 'STOPPED') return null

  const isPaused = timerState === 'PAUSED'

  const handlePause = () => {
    pauseTimer(elapsedSeconds)
    toast.success('Timer paused')
  }

  const handleResume = () => {
    resumeTimer()
    toast.success('Timer resumed')
  }

  const handleStop = async () => {
    const duration = Math.max(1, Math.floor(elapsedSeconds / 60)) // At least 1 minute for the entry
    const taskTitle = currentTask

    createEntry.mutate(
      {
        taskName: taskTitle,
        taskId: currentTaskId || undefined,
        taskTitle,
        duration,
        date: getLocalDateString(),
        notes: 'Timer session',
        goalId: currentGoalId || undefined,
        startedAt: startTimestamp ? new Date(startTimestamp).toISOString() : undefined,
        scheduleBlockId: currentScheduleBlockId || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Logged ${formatDuration(duration)}!`)
          reset()
        },
      },
    )
  }

  return (
    <div className="sticky top-0 z-30 border-b-3 border-secondary bg-primary text-secondary">
      <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border-3 border-secondary bg-white shadow-brutal-sm sm:h-10 sm:w-10 md:h-11 md:w-11">
            {isPaused ? <Pause className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" /> : <Timer className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase text-secondary/80 sm:text-xs">
              {isPaused ? 'Time entry paused' : 'Time entry in progress'}
            </p>
            <p className="line-clamp-1 text-sm font-bold uppercase sm:text-base md:text-lg">{currentTask || 'Untitled Task'}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 md:gap-3">
          {permission === 'default' && (
            <button
              onClick={requestPermission}
              className="btn-brutal flex h-8 items-center gap-1 bg-yellow-400 px-2 text-xs font-bold text-black hover:bg-yellow-500 sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"
              title="Enable Reminders"
            >
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Remind Me</span>
            </button>
          )}
          {timerState === 'RUNNING' && (
            <button
              onClick={handlePause}
              disabled={createEntry.isPending}
              className="btn-brutal flex h-8 items-center justify-center bg-accent-orange px-2 text-white hover:bg-accent-orange/90 disabled:opacity-50 sm:h-10 sm:px-3"
              title="Pause timer"
            >
              <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          )}
          {timerState === 'PAUSED' && (
            <button
              onClick={handleResume}
              disabled={createEntry.isPending}
              className="btn-brutal flex h-8 items-center justify-center bg-green-500 px-2 text-white hover:bg-green-600 disabled:opacity-50 sm:h-10 sm:px-3"
              title="Resume timer"
            >
              <Play className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          )}
          <button
            onClick={handleStop}
            disabled={createEntry.isPending}
            className="btn-brutal flex h-8 items-center justify-center bg-red-500 px-2 text-white hover:bg-red-600 disabled:opacity-50 sm:h-10 sm:px-3"
            title="Stop and save timer"
          >
            <Square className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
          <span className="badge-brutal bg-white font-mono text-[10px] uppercase tracking-tight text-secondary sm:text-xs md:text-sm">
            {formatTimerDisplay(elapsedSeconds)}
          </span>
          <Link
            href="/dashboard/time-tracker"
            className="btn-brutal flex h-8 items-center gap-1 bg-secondary px-2 text-xs text-white sm:h-auto sm:gap-2 sm:px-3 sm:text-sm"
          >
            <Clock3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Open Tracker</span>
            <span className="sm:hidden">Open</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
