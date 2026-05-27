'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Clock3, Pause, Timer, Bell, Square, Play } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useTimerStore } from '@/lib/use-timer-store'
import { useTimerNotifications } from '@/hooks/use-timer-notifications'
import { useCreateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { formatDuration, getLocalDateString } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
    <div className="sticky top-0 z-30 border-b border-yellow-400/20 bg-yellow-400/10">
      <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-yellow-400/30 timer-glow">
            {isPaused ? <Pause className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-wider uppercase text-yellow-700">
              {isPaused ? 'Time entry paused' : 'Time entry in progress'}
            </p>
            <p className="line-clamp-1 text-sm font-bold sm:text-base md:text-lg">{currentTask || 'Untitled Task'}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 md:gap-3">
          {permission === 'default' && (
            <Button
              onClick={requestPermission}
              variant="brand"
              size="sm"
              title="Enable Reminders"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Remind Me</span>
            </Button>
          )}
          {timerState === 'RUNNING' && (
            <Button
              onClick={handlePause}
              disabled={createEntry.isPending}
              variant="secondary"
              size="sm"
              title="Pause timer"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          {timerState === 'PAUSED' && (
            <Button
              onClick={handleResume}
              disabled={createEntry.isPending}
              variant="secondary"
              size="sm"
              title="Resume timer"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={handleStop}
            disabled={createEntry.isPending}
            variant="destructive"
            size="sm"
            title="Stop and save timer"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Badge variant="brand" className="font-mono tabular-nums">
            {formatTimerDisplay(elapsedSeconds)}
          </Badge>
          <Button asChild variant="default" size="sm">
            <Link href="/dashboard/time-tracker">
              <Clock3 className="h-4 w-4" />
              <span className="hidden sm:inline">Open Tracker</span>
              <span className="sm:hidden">Open</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
