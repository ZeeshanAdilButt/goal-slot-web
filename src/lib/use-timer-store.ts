import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TimerState = 'STOPPED' | 'RUNNING' | 'PAUSED'

interface TimerStoreState {
  timerState: TimerState
  startTimestamp: number | null
  pausedElapsedTime: number
  currentTask: string
  currentTaskId: string
  currentCategory: string
  currentGoalId: string
  currentScheduleBlockId: string
  reminderInterval: number // in minutes

  setTask: (task: string) => void
  setTaskId: (taskId: string) => void
  setCategory: (category: string) => void
  setGoalId: (goalId: string) => void
  setScheduleBlockId: (scheduleBlockId: string) => void
  setReminderInterval: (interval: number) => void
  start: (task: string, taskId: string, category: string, goalId: string, scheduleBlockId?: string) => void
  pause: (elapsedSeconds: number) => void
  resume: () => void
  reset: () => void
}

const TIMER_STORAGE_KEY = 'goalslot-timer'

export const useTimerStore = create<TimerStoreState>()(
  persist(
    (set, get) => ({
      timerState: 'STOPPED',
      startTimestamp: null,
      pausedElapsedTime: 0,
      currentTask: '',
      currentTaskId: '',
      currentCategory: 'DEEP_WORK',
      currentGoalId: '',
      currentScheduleBlockId: '',
      reminderInterval: 15,

      setTask: (task) => set({ currentTask: task }),
      setTaskId: (taskId) => set({ currentTaskId: taskId }),
      setCategory: (category) => set({ currentCategory: category }),
      setGoalId: (goalId) => set({ currentGoalId: goalId }),
      setScheduleBlockId: (scheduleBlockId) => set({ currentScheduleBlockId: scheduleBlockId }),
      setReminderInterval: (interval) => set({ reminderInterval: interval }),

      start: (task, taskId, category, goalId, scheduleBlockId) =>
        set({
          timerState: 'RUNNING',
          startTimestamp: Date.now(),
          pausedElapsedTime: 0,
          currentTask: task,
          currentTaskId: taskId,
          currentCategory: category,
          currentGoalId: goalId,
          currentScheduleBlockId: scheduleBlockId ?? get().currentScheduleBlockId,
          currentScheduleBlockId: scheduleBlockId ?? get().currentScheduleBlockId,
        }),

      pause: (elapsedSeconds) =>
        set({
          timerState: 'PAUSED',
          startTimestamp: null,
          pausedElapsedTime: elapsedSeconds,
        }),

      resume: () =>
        set((state) => ({
          timerState: 'RUNNING',
          startTimestamp: Date.now(),
          pausedElapsedTime: state.pausedElapsedTime,
        })),

      reset: () =>
        set({
          timerState: 'STOPPED',
          startTimestamp: null,
          pausedElapsedTime: 0,
          currentTask: '',
          currentTaskId: '',
          currentGoalId: '',
          currentScheduleBlockId: '',
        }),
    }),
    {
      name: TIMER_STORAGE_KEY,
    },
  ),
)
