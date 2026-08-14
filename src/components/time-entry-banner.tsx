'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Clock3, Pause, Timer, Bell, Square, Play, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useTimer } from '@/features/time-tracker/hooks/use-timer'
import { useTimerNotifications } from '@/hooks/use-timer-notifications'
import { useCreateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { UNTITLED_ENTRY_TITLE, resolveEntryTitle } from '@/features/time-tracker/utils/entry-title'
import { formatDuration, getLocalDateString } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FocusNowBar } from '@/components/focus-now-bar'
import { StartTrackingPopover } from '@/components/start-tracking-popover'

const formatTimerDisplay = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function TimeEntryBanner() {
  // Same server-authoritative hook the Time Tracker page uses. This banner
  // used to read the local Zustand store directly, which only ever knows
  // about a timer started in this browser - a takeover, pause, or stop from
  // another device (or the Time Tracker page itself) left it showing a
  // running timer with a stale elapsed time no server call would ever
  // correct, while the actual page one click away showed the real,
  // server-synced state. Sharing this hook makes the two impossible to
  // disagree: both derive from the exact same effective state.
  const {
    timerState,
    elapsedTime: elapsedSeconds,
    currentTask,
    currentTaskId,
    currentCategory,
    currentGoalId,
    currentScheduleBlockId,
    startTimestamp,
    pause: pauseTimer,
    resume: resumeTimer,
    reset,
  } = useTimer()
  const [startPopoverOpen, setStartPopoverOpen] = useState(false)
  const { permission, requestPermission } = useTimerNotifications()
  const createEntry = useCreateTimeEntry()

  // Bridge for the Ctrl+K command palette: dispatch
  // `goalslot:start-tracking` on window to open the quick-start popover.
  // Only acts when the timer is stopped — the popover isn't rendered
  // while a session is in progress and starting a second one would clash
  // with the running entry.
  useEffect(() => {
    const handler = () => {
      if (timerState === 'STOPPED') {
        setStartPopoverOpen(true)
      } else {
        toast('A timer is already running. Stop it first.', { icon: '⏱️' })
      }
    }
    window.addEventListener('goalslot:start-tracking', handler as EventListener)
    return () => window.removeEventListener('goalslot:start-tracking', handler as EventListener)
  }, [timerState])

  if (timerState === 'STOPPED') {
    // Always-on quick shortcut bar so users can start tracking, log time,
    // or capture a note from any dashboard page without navigating first.
    return (
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock3 className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-medium text-zinc-700">Not tracking</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notes?action=new">
            <Button variant="ghost" size="sm">
              <FileText className="h-3.5 w-3.5" />
              + Note
            </Button>
          </Link>
          <Link href="/dashboard/time-tracker?action=manual">
            <Button variant="ghost" size="sm">
              <Clock3 className="h-3.5 w-3.5" />
              + Log time
            </Button>
          </Link>
          <Button variant="brand" size="sm" onClick={() => setStartPopoverOpen(true)}>
            <Play className="h-3.5 w-3.5" />
            Start tracking
          </Button>
        </div>
        <StartTrackingPopover open={startPopoverOpen} onClose={() => setStartPopoverOpen(false)} />
      </div>
    )
  }

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
    // A session can be started with nothing filled in, so the title may still
    // be blank here. taskName is required downstream — resolve it, don't ship
    // an empty string that reports would render as a nameless row.
    const taskTitle = resolveEntryTitle(currentTask)

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
          <div className="timer-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-yellow-400/30 bg-white">
            {isPaused ? <Pause className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-700">
              {isPaused ? 'Time entry paused' : 'Time entry in progress'}
            </p>
            {currentTaskId ? (
              <Link
                href={`/dashboard/tasks?taskId=${currentTaskId}`}
                title="Open this task"
                className="line-clamp-1 inline-block text-sm font-bold underline-offset-2 hover:text-yellow-800 hover:underline sm:text-base md:text-lg"
              >
                {currentTask || UNTITLED_ENTRY_TITLE}
              </Link>
            ) : (
              <p className="line-clamp-1 text-sm font-bold sm:text-base md:text-lg">{currentTask || UNTITLED_ENTRY_TITLE}</p>
            )}
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
