'use client'

import { useEffect, useRef, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Clock, History, Pause, Play, Plus, RefreshCw, Square, Target, Timer } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { goalsApi, timeEntriesApi } from '@/lib/api'
import { cn, formatDate, formatDuration, TASK_CATEGORIES } from '@/lib/utils'

interface Goal {
  id: string
  title: string
  color: string
}

interface TimeEntry {
  id: string
  taskName: string
  notes?: string
  duration: number
  date: string
  goalId?: string
  goal?: Goal
}

type TimerState = 'STOPPED' | 'RUNNING' | 'PAUSED'

// Timer storage key
const TIMER_STORAGE_KEY = 'dw-time-master-timer'

interface TimerStorageState {
  timerState: TimerState
  startTimestamp: number | null
  pausedElapsedTime: number
  currentTask: string
  currentCategory: string
  currentGoalId: string
}

const saveTimerState = (state: TimerStorageState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state))
  }
}

const loadTimerState = (): TimerStorageState | null => {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(TIMER_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }
  return null
}

const clearTimerState = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TIMER_STORAGE_KEY)
  }
}

export default function TimeTrackerPage() {
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('STOPPED')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentTask, setCurrentTask] = useState('')
  const [currentCategory, setCurrentCategory] = useState('DEEP_WORK')
  const [currentGoalId, setCurrentGoalId] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const pausedElapsedRef = useRef<number>(0)

  // Data state
  const [goals, setGoals] = useState<Goal[]>([])
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showManualEntry, setShowManualEntry] = useState(false)

  // Restore timer state on mount
  useEffect(() => {
    const savedState = loadTimerState()
    if (savedState && savedState.timerState !== 'STOPPED') {
      setCurrentTask(savedState.currentTask)
      setCurrentCategory(savedState.currentCategory)
      setCurrentGoalId(savedState.currentGoalId)

      if (savedState.timerState === 'RUNNING' && savedState.startTimestamp) {
        // Calculate elapsed time since start
        const now = Date.now()
        const elapsed = Math.floor((now - savedState.startTimestamp) / 1000) + savedState.pausedElapsedTime
        setElapsedTime(elapsed)
        startTimeRef.current = new Date(savedState.startTimestamp)
        pausedElapsedRef.current = savedState.pausedElapsedTime
        setTimerState('RUNNING')

        // Resume the interval
        timerRef.current = setInterval(() => {
          const currentElapsed =
            Math.floor((Date.now() - savedState.startTimestamp!) / 1000) + savedState.pausedElapsedTime
          setElapsedTime(currentElapsed)
        }, 1000)
      } else if (savedState.timerState === 'PAUSED') {
        setElapsedTime(savedState.pausedElapsedTime)
        pausedElapsedRef.current = savedState.pausedElapsedTime
        setTimerState('PAUSED')
      }
    }

    loadData()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const loadData = async () => {
    try {
      const [goalsRes, entriesRes] = await Promise.all([
        goalsApi.getAll('ACTIVE'),
        timeEntriesApi.getByDateRange(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0],
        ),
      ])
      setGoals(goalsRes.data)
      setRecentEntries(entriesRes.data.slice(0, 10))
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // Timer controls
  const startTimer = () => {
    if (!currentTask.trim()) {
      toast.error('Please enter a task name')
      return
    }

    const now = new Date()
    startTimeRef.current = now
    pausedElapsedRef.current = 0
    setTimerState('RUNNING')
    setElapsedTime(0)

    // Save to localStorage
    saveTimerState({
      timerState: 'RUNNING',
      startTimestamp: now.getTime(),
      pausedElapsedTime: 0,
      currentTask,
      currentCategory,
      currentGoalId,
    })

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
  }

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    pausedElapsedRef.current = elapsedTime
    setTimerState('PAUSED')

    // Save paused state
    saveTimerState({
      timerState: 'PAUSED',
      startTimestamp: null,
      pausedElapsedTime: elapsedTime,
      currentTask,
      currentCategory,
      currentGoalId,
    })
  }

  const resumeTimer = () => {
    const now = Date.now()
    setTimerState('RUNNING')

    // Save resumed state
    saveTimerState({
      timerState: 'RUNNING',
      startTimestamp: now,
      pausedElapsedTime: pausedElapsedRef.current,
      currentTask,
      currentCategory,
      currentGoalId,
    })

    timerRef.current = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - now) / 1000) + pausedElapsedRef.current
      setElapsedTime(currentElapsed)
    }, 1000)
  }

  const stopTimer = async () => {
    if (timerRef.current) clearInterval(timerRef.current)

    if (elapsedTime < 60) {
      toast.error('Minimum duration is 1 minute')
      return
    }

    try {
      const duration = Math.floor(elapsedTime / 60)
      await timeEntriesApi.create({
        taskName: currentTask,
        duration,
        date: new Date().toISOString().split('T')[0],
        notes: `Timer session`,
        goalId: currentGoalId || undefined,
      })

      toast.success(`Logged ${formatDuration(duration)}!`)
      resetTimer()
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save entry')
    }
  }

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerState('STOPPED')
    setElapsedTime(0)
    setCurrentTask('')
    setCurrentGoalId('')
    startTimeRef.current = null
    pausedElapsedRef.current = 0
    clearTimerState()
  }

  const formatTimerDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const todayTotalMinutes = recentEntries
    .filter((e) => e.date === new Date().toISOString().split('T')[0])
    .reduce((sum, e) => sum + e.duration, 0)

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
        {/* Task Input */}
        <div className="mb-6">
          <input
            type="text"
            value={currentTask}
            onChange={(e) => setCurrentTask(e.target.value)}
            placeholder="What are you working on?"
            disabled={timerState !== 'STOPPED'}
            className="w-full border-3 border-white/30 bg-white/10 px-4 py-3 text-xl font-bold text-white placeholder-white/50 focus:border-primary focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Category and Goal Selection */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase opacity-75">Category</label>
            <select
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
              disabled={timerState !== 'STOPPED'}
              className="w-full border-2 border-white/30 bg-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none disabled:opacity-50"
            >
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="text-secondary">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold uppercase opacity-75">Link to Goal</label>
            <select
              value={currentGoalId}
              onChange={(e) => setCurrentGoalId(e.target.value)}
              disabled={timerState !== 'STOPPED'}
              className="w-full border-2 border-white/30 bg-white/10 px-4 py-2 text-white focus:border-primary focus:outline-none disabled:opacity-50"
            >
              <option value="" className="text-secondary">
                No Goal
              </option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id} className="text-secondary">
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timer Display */}
        <div className="mb-8 text-center">
          <motion.div
            className="font-mono text-7xl font-bold tracking-wider md:text-8xl"
            animate={timerState === 'RUNNING' ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1, repeat: timerState === 'RUNNING' ? Infinity : 0 }}
          >
            {formatTimerDisplay(elapsedTime)}
          </motion.div>
          <div className="mt-2 font-mono text-lg opacity-75">
            {timerState === 'STOPPED' && 'Ready to start'}
            {timerState === 'RUNNING' && '⏱ Timer running...'}
            {timerState === 'PAUSED' && '⏸ Paused'}
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center gap-4">
          {timerState === 'STOPPED' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startTimer}
              className="flex h-20 w-20 items-center justify-center border-4 border-white bg-primary text-secondary shadow-brutal"
            >
              <Play className="h-10 w-10" />
            </motion.button>
          )}

          {timerState === 'RUNNING' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={pauseTimer}
                className="flex h-16 w-16 items-center justify-center border-4 border-white bg-accent-orange text-white shadow-brutal"
              >
                <Pause className="h-8 w-8" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopTimer}
                className="flex h-16 w-16 items-center justify-center border-4 border-white bg-red-500 text-white shadow-brutal"
              >
                <Square className="h-8 w-8" />
              </motion.button>
            </>
          )}

          {timerState === 'PAUSED' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resumeTimer}
                className="flex h-16 w-16 items-center justify-center border-4 border-white bg-primary text-secondary shadow-brutal"
              >
                <Play className="h-8 w-8" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopTimer}
                className="flex h-16 w-16 items-center justify-center border-4 border-white bg-accent-green text-white shadow-brutal"
              >
                <Square className="h-8 w-8" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetTimer}
                className="flex h-16 w-16 items-center justify-center border-4 border-white bg-gray-500 text-white shadow-brutal"
              >
                <RefreshCw className="h-8 w-8" />
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card-brutal text-center">
          <Timer className="mx-auto mb-2 h-8 w-8" />
          <div className="text-3xl font-bold">{formatDuration(todayTotalMinutes)}</div>
          <div className="font-mono text-sm uppercase text-gray-600">Today's Total</div>
        </div>
        <div className="card-brutal-colored bg-primary text-center">
          <Target className="mx-auto mb-2 h-8 w-8" />
          <div className="text-3xl font-bold">
            {recentEntries.filter((e) => e.date === new Date().toISOString().split('T')[0]).length}
          </div>
          <div className="font-mono text-sm uppercase">Tasks Today</div>
        </div>
        <div className="card-brutal text-center">
          <History className="mx-auto mb-2 h-8 w-8" />
          <div className="text-3xl font-bold">{recentEntries.length}</div>
          <div className="font-mono text-sm uppercase text-gray-600">Last 7 Days</div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="card-brutal">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold uppercase">
          <History className="h-6 w-6" />
          Recent Time Entries
        </h2>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin border-4 border-secondary border-t-primary" />
          </div>
        ) : recentEntries.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="font-mono uppercase">No entries yet</p>
            <p className="text-sm">Start tracking your time!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between border-2 border-secondary bg-white p-4 transition-all hover:shadow-brutal"
              >
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <div>
                    <div className="font-bold">{entry.taskName}</div>
                    <div className="font-mono text-xs text-gray-500">
                      {entry.goal && `${entry.goal.title}`}
                      {entry.notes && ` • ${entry.notes}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{formatDuration(entry.duration)}</div>
                  <div className="font-mono text-xs text-gray-500">{formatDate(entry.date)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onSuccess={loadData}
        goals={goals}
      />
    </div>
  )
}

// Manual Entry Modal
function ManualEntryModal({
  isOpen,
  onClose,
  onSuccess,
  goals,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  goals: Goal[]
}) {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [category, setCategory] = useState('DEEP_WORK')
  const [goalId, setGoalId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('09:00')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await timeEntriesApi.create({
        taskName: title,
        duration,
        date,
        notes: `Manual entry`,
        goalId: goalId || undefined,
      })

      toast.success('Time entry added!')
      onSuccess()
      onClose()
      setTitle('')
      setDuration(30)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add entry')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-brutal relative z-10 w-full max-w-md"
          >
            <h2 className="mb-6 text-2xl font-bold uppercase">Manual Time Entry</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What did you work on?"
                  className="input-brutal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-brutal"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-brutal"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Duration (minutes)</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90, 120].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDuration(min)}
                      className={cn(
                        'flex-1 py-2 border-2 border-secondary font-mono text-sm transition-all',
                        duration === min ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100',
                      )}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  min={1}
                  className="input-brutal mt-2"
                  placeholder="Custom duration"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-brutal">
                  {TASK_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Link to Goal (Optional)</label>
                <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className="input-brutal">
                  <option value="">No Goal</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="btn-brutal-dark flex-1">
                  {isLoading ? 'Adding...' : 'Add Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
