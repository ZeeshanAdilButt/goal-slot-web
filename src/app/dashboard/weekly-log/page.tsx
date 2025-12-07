'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Clock,
  Target,
  Edit2,
  Trash2,
  Calendar
} from 'lucide-react'
import { timeEntriesApi, goalsApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn, formatDuration, formatDate, getWeekDates, TASK_CATEGORIES, getCategoryColor } from '@/lib/utils'
import { useHasProAccess } from '@/lib/store'

interface TimeEntry {
  id: string
  title: string
  description?: string
  category: string
  duration: number
  startTime?: string
  endTime?: string
  date: string
  goalId?: string
  goal?: { id: string; title: string; color: string }
}

interface Goal {
  id: string
  title: string
  color: string
}

interface WeekData {
  [date: string]: TimeEntry[]
}

export default function WeeklyLogPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekData, setWeekData] = useState<WeekData>({})
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const hasProAccess = useHasProAccess()

  const weekDates = useMemo(() => {
    const today = new Date()
    today.setDate(today.getDate() + weekOffset * 7)
    return getWeekDates(today)
  }, [weekOffset])

  useEffect(() => {
    loadData()
  }, [weekOffset, weekDates])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const startDate = weekDates.start.toISOString().split('T')[0]
      const endDate = weekDates.end.toISOString().split('T')[0]
      
      const [entriesRes, goalsRes] = await Promise.all([
        timeEntriesApi.getByRange(startDate, endDate),
        goalsApi.getAll('ACTIVE'),
      ])
      
      // Group entries by date
      const grouped: WeekData = {}
      weekDates.days.forEach(day => {
        grouped[day.toISOString().split('T')[0]] = []
      })
      
      entriesRes.data.forEach((entry: TimeEntry) => {
        if (grouped[entry.date]) {
          grouped[entry.date].push(entry)
        }
      })
      
      setWeekData(grouped)
      setGoals(goalsRes.data)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEntry = (date: string) => {
    // Check free plan limit
    const todayEntries = weekData[date]?.length || 0
    if (!hasProAccess && todayEntries >= 3) {
      toast.error('Free plan limit: 3 entries per day. Upgrade to Pro for unlimited!')
      return
    }
    
    setSelectedDate(date)
    setEditingEntry(null)
    setShowEntryModal(true)
  }

  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedDate(entry.date)
    setEditingEntry(entry)
    setShowEntryModal(true)
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    
    try {
      await timeEntriesApi.delete(id)
      toast.success('Entry deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleCloseModal = () => {
    setShowEntryModal(false)
    setEditingEntry(null)
    setSelectedDate(null)
  }

  // Calculate totals
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    Object.entries(weekData).forEach(([date, entries]) => {
      totals[date] = entries.reduce((sum, e) => sum + e.duration, 0)
    })
    return totals
  }, [weekData])

  const weeklyTotal = useMemo(() => {
    return Object.values(dailyTotals).reduce((a, b) => a + b, 0)
  }, [dailyTotals])

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase">Weekly Log</h1>
          <p className="font-mono text-gray-600 uppercase">Track your time day by day</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="card-brutal-sm py-2 px-4 bg-primary">
            <span className="font-mono font-bold">{formatDuration(weeklyTotal)}</span>
            <span className="text-xs uppercase ml-1">this week</span>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="card-brutal">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-12 h-12 border-3 border-secondary flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="text-2xl font-bold uppercase">
              {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} Weeks ${weekOffset < 0 ? 'Ago' : 'Ahead'}`}
            </div>
            <div className="font-mono text-gray-600">
              {formatDate(weekDates.start, 'MMM d')} - {formatDate(weekDates.end, 'MMM d, yyyy')}
            </div>
          </div>

          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-12 h-12 border-3 border-secondary flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Free Plan Limit Notice */}
      {!hasProAccess && (
        <div className="card-brutal-sm bg-gray-100">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm">
              <span className="font-bold">Free Plan:</span> 3 time entries per day
            </p>
            <a href="/dashboard/settings#billing" className="text-sm font-bold underline">
              Upgrade
            </a>
          </div>
        </div>
      )}

      {/* Weekly Grid */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-secondary border-t-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.days.map((day) => {
            const dateStr = day.toISOString().split('T')[0]
            const entries = weekData[dateStr] || []
            const dayTotal = dailyTotals[dateStr] || 0
            const today = isToday(day)
            
            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'card-brutal p-0 overflow-hidden flex flex-col',
                  today && 'ring-4 ring-primary ring-offset-2'
                )}
              >
                {/* Day Header */}
                <div className={cn(
                  'p-3 border-b-3 border-secondary',
                  today ? 'bg-primary' : 'bg-gray-100'
                )}>
                  <div className="text-center">
                    <div className="font-bold uppercase text-sm">
                      {formatDate(day, 'EEE')}
                    </div>
                    <div className="font-mono text-lg font-bold">
                      {formatDate(day, 'd')}
                    </div>
                    <div className="font-mono text-xs text-gray-600">
                      {formatDuration(dayTotal)}
                    </div>
                  </div>
                </div>

                {/* Entries */}
                <div className="flex-1 p-2 space-y-2 min-h-[200px] bg-white">
                  <AnimatePresence>
                    {entries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-2 border-2 border-secondary bg-white hover:shadow-brutal-sm transition-all cursor-pointer group"
                        onClick={() => handleEditEntry(entry)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <div className={cn('w-2 h-2 flex-shrink-0', getCategoryColor(entry.category))} />
                              <span className="font-bold text-xs truncate uppercase">
                                {entry.title}
                              </span>
                            </div>
                            <div className="font-mono text-xs text-gray-600 mt-1">
                              {formatDuration(entry.duration)}
                            </div>
                            {entry.goal && (
                              <div className="font-mono text-[10px] text-gray-500 truncate mt-0.5">
                                → {entry.goal.title}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id) }}
                            className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add Button */}
                <button
                  onClick={() => handleAddEntry(dateStr)}
                  className="w-full p-2 border-t-2 border-secondary bg-gray-50 hover:bg-primary transition-colors flex items-center justify-center gap-1 font-bold text-sm uppercase"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Category Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {TASK_CATEGORIES.map((cat) => (
          <div key={cat.value} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 border border-secondary', cat.color)} />
            <span className="font-mono text-xs uppercase">{cat.label}</span>
          </div>
        ))}
      </div>

      {/* Entry Modal */}
      <TimeEntryModal
        isOpen={showEntryModal}
        onClose={handleCloseModal}
        onSuccess={loadData}
        entry={editingEntry}
        date={selectedDate}
        goals={goals}
      />
    </div>
  )
}

// Time Entry Modal Component
function TimeEntryModal({
  isOpen,
  onClose,
  onSuccess,
  entry,
  date,
  goals,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  entry: TimeEntry | null
  date: string | null
  goals: Goal[]
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(30)
  const [category, setCategory] = useState('DEEP_WORK')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('')
  const [goalId, setGoalId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (entry) {
      setTitle(entry.title)
      setDescription(entry.description || '')
      setDuration(entry.duration)
      setCategory(entry.category)
      setStartTime(entry.startTime || '09:00')
      setEndTime(entry.endTime || '')
      setGoalId(entry.goalId || '')
    } else {
      resetForm()
    }
  }, [entry])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDuration(30)
    setCategory('DEEP_WORK')
    setStartTime('09:00')
    setEndTime('')
    setGoalId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = {
        title,
        description: description || undefined,
        duration,
        category,
        date: date || entry?.date,
        startTime,
        endTime: endTime || undefined,
        goalId: goalId || undefined,
      }

      if (entry) {
        await timeEntriesApi.update(entry.id, data)
        toast.success('Entry updated')
      } else {
        await timeEntriesApi.create(data)
        toast.success('Entry added')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save')
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold uppercase">
                  {entry ? 'Edit Entry' : 'New Entry'}
                </h2>
                {date && (
                  <p className="font-mono text-sm text-gray-600">
                    {formatDate(date, 'EEEE, MMM d')}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="w-10 h-10 border-3 border-secondary flex items-center justify-center hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

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

              <div>
                <label className="block font-bold uppercase text-sm mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={2}
                  className="input-brutal resize-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-2">Duration (minutes)</label>
                <div className="flex gap-2 flex-wrap">
                  {[15, 30, 45, 60, 90, 120].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDuration(min)}
                      className={cn(
                        'px-3 py-2 border-2 border-secondary font-mono text-sm transition-all',
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-sm mb-2">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-brutal"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-sm mb-2">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-brutal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {TASK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        'p-2 border-2 border-secondary text-xs font-bold uppercase transition-all',
                        category === cat.value ? `${cat.color} shadow-brutal-sm` : 'bg-white hover:bg-gray-100'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
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
                  {isLoading ? 'Saving...' : entry ? 'Update' : 'Add Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
