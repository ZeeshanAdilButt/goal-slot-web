'use client'

import { useState } from 'react'

import { useCreateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { useTimer } from '@/features/time-tracker/hooks/use-timer'
import { toast } from 'react-hot-toast'

import { getLocalDateString } from '@/lib/utils'

interface StartTimerParams {
  task: string
  taskId: string
  category: string
  goalId: string
  scheduleBlockId?: string
  taskTitle?: string
  onStartTimer?: () => void | Promise<void> // Callback to execute after confirmation (e.g., update task status)
}

export function useStartTimerWithConfirmation() {
  const {
    timerState,
    elapsedTime,
    currentTask,
    currentTaskId,
    currentCategory,
    currentGoalId,
    currentScheduleBlockId,
    start,
    reset,
    startTimestamp,
  } = useTimer()
  const createEntry = useCreateTimeEntry()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingTimerParams, setPendingTimerParams] = useState<StartTimerParams | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const startTimerWithCheck = (params: StartTimerParams) => {
    const isTimerActive = timerState === 'RUNNING' || timerState === 'PAUSED'
    const hasMinimumTime = elapsedTime >= 60 // 1 minute in seconds

    // If no timer is running, or timer has been running for less than 1 minute, start immediately
    if (!isTimerActive || !hasMinimumTime) {
      // Execute callback first (e.g., update task status)
      params.onStartTimer?.()
      start(params.task, params.taskId, params.category, params.goalId, params.scheduleBlockId)
      return
    }

    // Show confirmation dialog for timers with 1+ minutes
    setPendingTimerParams(params)
    setShowConfirmDialog(true)
  }

  const handleSaveAndSwitch = async () => {
    if (!pendingTimerParams) return

    setIsLoading(true)

    try {
      const duration = Math.max(1, Math.floor(elapsedTime / 60)) // At least 1 minute

      // Save the CURRENT timer as a time entry (not the pending one)
      await createEntry.mutateAsync({
        taskName: currentTask,
        taskId: currentTaskId || undefined,
        taskTitle: currentTask,
        duration,
        date: getLocalDateString(),
        notes: 'Timer session',
        goalId: currentGoalId || undefined,
        startedAt: startTimestamp ? new Date(startTimestamp).toISOString() : undefined,
        scheduleBlockId: currentScheduleBlockId || undefined,
      })

      const minutes = Math.floor(duration)
      toast.success(`Saved previous timer (${minutes} ${minutes === 1 ? 'minute' : 'minutes'})`)

      // Execute callback (e.g., update task status) before starting new timer
      await pendingTimerParams.onStartTimer?.()

      // Start the new timer
      start(
        pendingTimerParams.task,
        pendingTimerParams.taskId,
        pendingTimerParams.category,
        pendingTimerParams.goalId,
        pendingTimerParams.scheduleBlockId,
      )

      setShowConfirmDialog(false)
      setPendingTimerParams(null)
    } catch (error) {
      toast.error('Failed to save timer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscardAndContinue = async () => {
    if (!pendingTimerParams) return

    // Reset the timer without saving
    reset()
    toast.success('Previous timer discarded')

    // Execute callback (e.g., update task status) before starting new timer
    await pendingTimerParams.onStartTimer?.()

    // Start the new timer
    start(
      pendingTimerParams.task,
      pendingTimerParams.taskId,
      pendingTimerParams.category,
      pendingTimerParams.goalId,
      pendingTimerParams.scheduleBlockId,
    )

    setShowConfirmDialog(false)
    setPendingTimerParams(null)
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setPendingTimerParams(null)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return {
    startTimer: startTimerWithCheck,
    showConfirmDialog,
    setShowConfirmDialog,
    currentTask,
    elapsedTime: formatDuration(elapsedTime),
    handleSaveAndSwitch,
    handleDiscardAndContinue,
    isLoading,
  }
}
