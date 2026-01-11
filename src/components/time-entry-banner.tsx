'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Clock3, Pause, Timer, Bell } from 'lucide-react'

import { useTimerStore } from '@/lib/use-timer-store'
import { useTimerNotifications } from '@/hooks/use-timer-notifications'

const formatTimerDisplay = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function TimeEntryBanner() {
  const { timerState, currentTask, startTimestamp, pausedElapsedTime } = useTimerStore((state) => ({
    timerState: state.timerState,
    currentTask: state.currentTask,
    startTimestamp: state.startTimestamp,
    pausedElapsedTime: state.pausedElapsedTime,
  }))
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const { permission, requestPermission } = useTimerNotifications()

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

  return (
    <div className="sticky top-0 z-30 border-b-3 border-secondary bg-primary text-secondary">
      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border-3 border-secondary bg-white shadow-brutal-sm">
            {isPaused ? <Pause className="h-6 w-6" /> : <Timer className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase text-secondary/80">
              {isPaused ? 'Time entry paused' : 'Time entry in progress'}
            </p>
            <p className="line-clamp-1 text-lg font-bold uppercase">{currentTask || 'Untitled Task'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {permission === 'default' && (
            <button
              onClick={requestPermission}
              className="btn-brutal flex h-10 items-center gap-2 bg-yellow-400 px-3 text-sm font-bold text-black hover:bg-yellow-500"
              title="Enable Reminders"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Remind Me</span>
            </button>
          )}
          <span className="badge-brutal bg-white font-mono text-sm uppercase tracking-tight text-secondary">
            {formatTimerDisplay(elapsedSeconds)}
          </span>
          <Link
            href="/dashboard/time-tracker"
            className="btn-brutal flex items-center gap-2 bg-secondary text-white"
          >
            <Clock3 className="h-4 w-4" />
            Open Tracker
          </Link>
        </div>
      </div>
    </div>
  )
}
