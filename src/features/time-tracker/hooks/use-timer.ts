import { useEffect, useRef, useState } from 'react'
import { useTimerStore } from '@/lib/use-timer-store'

export function useTimer() {
  const {
    timerState,
    startTimestamp,
    pausedElapsedTime,
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
  } = useTimerStore()

  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (timerState === 'RUNNING' && startTimestamp) {
      const updateElapsed = () =>
        setElapsedTime(Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsedTime)

      updateElapsed()
      timerRef.current = setInterval(updateElapsed, 1000)
    } else {
      setElapsedTime(pausedElapsedTime)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerState, startTimestamp, pausedElapsedTime])

  return {
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
    setElapsedTime, // Exposed for reset logic if needed, though reset() handles store
    startTimestamp,
  }
}
