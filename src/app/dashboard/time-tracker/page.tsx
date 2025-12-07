'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Clock, 
  Plus,
  Target,
  Calendar,
  Timer,
  History
} from 'lucide-react'
import { timeEntriesApi, goalsApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn, formatDuration, TASK_CATEGORIES, formatDate } from '@/lib/utils'

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
          const currentElapsed = Math.floor((Date.now() - savedState.startTimestamp!) / 1000) + savedState.pausedElapsedTime
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
          new Date().toISOString().split('T')[0]
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
    .filter(e => e.date === new Date().toISOString().split('T')[0])
    .reduce((sum, e) => sum + e.duration, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase">Time Tracker</h1>
          <p className="font-mono text-gray-600 uppercase">Track time with precision</p>
        </div>

        <button 
          onClick={() => setShowManualEntry(true)}
          className="btn-brutal flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Manual Entry
        </button>
      </div>

      {/* Timer Section */}
      <motion.div 
        className="card-brutal-colored bg-secondary text-white p-8"
        animate={timerState === 'RUNNING' ? { 
          boxShadow: ['8px 8px 0 0 rgba(250,204,21,1)', '12px 12px 0 0 rgba(250,204,21,1)', '8px 8px 0 0 rgba(250,204,21,1)']
        } : {}}
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
            className="w-full px-4 py-3 text-xl font-bold bg-white/10 border-3 border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-primary disabled:opacity-50"
          />
        </div>

        {/* Category and Goal Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase opacity-75">Category</label>
            <select
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
              disabled={timerState !== 'STOPPED'}
              className="w-full px-4 py-2 bg-white/10 border-2 border-white/30 text-white focus:outline-none focus:border-primary disabled:opacity-50"
            >
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="text-secondary">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 uppercase opacity-75">Link to Goal</label>
            <select
              value={currentGoalId}
              onChange={(e) => setCurrentGoalId(e.target.value)}
              disabled={timerState !== 'STOPPED'}
              className="w-full px-4 py-2 bg-white/10 border-2 border-white/30 text-white focus:outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="" className="text-secondary">No Goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id} className="text-secondary">
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <motion.div 
            className="text-7xl md:text-8xl font-mono font-bold tracking-wider"
            animate={timerState === 'RUNNING' ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1, repeat: timerState === 'RUNNING' ? Infinity : 0 }}
          >
            {formatTimerDisplay(elapsedTime)}
          </motion.div>
          <div className="mt-2 text-lg font-mono opacity-75">
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
              className="w-20 h-20 bg-primary text-secondary border-4 border-white flex items-center justify-center shadow-brutal"
            >
              <Play className="w-10 h-10" />
            </motion.button>
          )}

          {timerState === 'RUNNING' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={pauseTimer}
                className="w-16 h-16 bg-accent-orange text-white border-4 border-white flex items-center justify-center shadow-brutal"
              >
                <Pause className="w-8 h-8" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopTimer}
                className="w-16 h-16 bg-red-500 text-white border-4 border-white flex items-center justify-center shadow-brutal"
              >
                <Square className="w-8 h-8" />
              </motion.button>
            </>
          )}

          {timerState === 'PAUSED' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resumeTimer}
                className="w-16 h-16 bg-primary text-secondary border-4 border-white flex items-center justify-center shadow-brutal"
              >
                <Play className="w-8 h-8" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopTimer}
                className="w-16 h-16 bg-accent-green text-white border-4 border-white flex items-center justify-center shadow-brutal"
              >
                <Square className="w-8 h-8" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetTimer}
                className="w-16 h-16 bg-gray-500 text-white border-4 border-white flex items-center justify-center shadow-brutal"
              >
                <RefreshCw className="w-8 h-8" />
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-brutal text-center">
          <Timer className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{formatDuration(todayTotalMinutes)}</div>
          <div className="font-mono text-sm text-gray-600 uppercase">Today's Total</div>
        </div>
        <div className="card-brutal-colored bg-primary text-center">
          <Target className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{recentEntries.filter(e => e.date === new Date().toISOString().split('T')[0]).length}</div>
          <div className="font-mono text-sm uppercase">Tasks Today</div>
        </div>
        <div className="card-brutal text-center">
          <History className="w-8 h-8 mx-auto mb-2" />
          <div className="text-3xl font-bold">{recentEntries.length}</div>
          <div className="font-mono text-sm text-gray-600 uppercase">Last 7 Days</div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="card-brutal">
        <h2 className="text-2xl font-bold uppercase mb-6 flex items-center gap-2">
          <History className="w-6 h-6" />
          Recent Time Entries
        </h2>

        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-primary" />
          </div>
        ) : recentEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                className="flex items-center justify-between p-4 border-2 border-secondary bg-white hover:shadow-brutal transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div>
                    <div className="font-bold">{entry.taskName}</div>
                    <div className="font-mono text-xs text-gray-500">
                      {entry.goal && `${entry.goal.title}`}
                      {entry.notes && ` • ${entry.notes}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono">{formatDuration(entry.duration)}</div>
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
            className="modal-brutal w-full max-w-md relative z-10"
          >
            <h2 className="text-2xl font-bold uppercase mb-6">Manual Time Entry</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold uppercase text-sm mb-2">Task Title</label>
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
                  <label className="block font-bold uppercase text-sm mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-brutal"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-sm mb-2">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-brutal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-2">Duration (minutes)</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90, 120].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDuration(min)}
                      className={cn(
                        'flex-1 py-2 border-2 border-secondary font-mono text-sm transition-all',
                        duration === min ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100'
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
                <label className="block font-bold uppercase text-sm mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-brutal"
                >
                  {TASK_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-2">Link to Goal (Optional)</label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="input-brutal"
                >
                  <option value="">No Goal</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>{goal.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="flex-1 btn-brutal-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 btn-brutal-dark">
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
