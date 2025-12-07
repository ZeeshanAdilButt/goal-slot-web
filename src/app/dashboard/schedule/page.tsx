'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Edit2, Trash2, Clock } from 'lucide-react'
import { scheduleApi, goalsApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn, SCHEDULE_CATEGORIES, DAYS_OF_WEEK_FULL, TIME_OPTIONS, timeToMinutes, getCategoryColor } from '@/lib/utils'
import { useHasProAccess } from '@/lib/store'

interface ScheduleBlock {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  category: string
  color: string
  isRecurring: boolean
  goalId?: string
  goal?: { id: string; title: string; color: string }
}

interface Goal {
  id: string
  title: string
  color: string
}

export default function SchedulePage() {
  const [weekSchedule, setWeekSchedule] = useState<Record<number, ScheduleBlock[]>>({})
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const hasProAccess = useHasProAccess()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [scheduleRes, goalsRes] = await Promise.all([
        scheduleApi.getWeekly(),
        goalsApi.getAll('ACTIVE'),
      ])
      setWeekSchedule(scheduleRes.data)
      setGoals(goalsRes.data)
    } catch (error) {
      toast.error('Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule block?')) return

    try {
      await scheduleApi.delete(id)
      toast.success('Block deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleEdit = (block: ScheduleBlock) => {
    setEditingBlock(block)
    setSelectedDay(block.dayOfWeek)
    setShowModal(true)
  }

  const handleAddBlock = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek)
    setEditingBlock(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingBlock(null)
    setSelectedDay(null)
  }

  const totalBlocks = Object.values(weekSchedule).flat().length

  // Time slots (6 AM to 10 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase">Schedule</h1>
          <p className="font-mono text-gray-600 uppercase">Plan your weekly time blocks</p>
        </div>

        <button 
          onClick={() => handleAddBlock(1)}
          className="btn-brutal flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Block
        </button>
      </div>

      {/* Free Plan Limit Notice */}
      {!hasProAccess && totalBlocks >= 5 && (
        <div className="card-brutal-colored bg-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold uppercase">Schedule limit reached (5 blocks)</p>
              <p className="font-mono text-sm">Upgrade to Pro for unlimited schedule blocks</p>
            </div>
            <a href="/dashboard/settings#billing" className="btn-brutal-dark">
              Upgrade
            </a>
          </div>
        </div>
      )}

      {/* Weekly Grid */}
      <div className="card-brutal p-0 overflow-hidden">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin w-12 h-12 border-4 border-secondary border-t-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-b-3 border-secondary">
                <div className="bg-secondary text-white p-4 font-bold uppercase text-center">
                  Time
                </div>
                {DAYS_OF_WEEK_FULL.map((day, i) => (
                  <div 
                    key={day} 
                    className="bg-secondary text-white p-4 font-bold uppercase text-center border-l-2 border-gray-700"
                  >
                    {day.slice(0, 3)}
                    <button
                      onClick={() => handleAddBlock(i)}
                      className="ml-2 w-6 h-6 inline-flex items-center justify-center bg-primary text-secondary text-xs hover:scale-110 transition-transform"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              {timeSlots.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-gray-200">
                  {/* Time Label */}
                  <div className="p-2 text-center font-mono text-sm bg-gray-50 border-r-3 border-secondary">
                    {hour.toString().padStart(2, '0')}:00
                  </div>

                  {/* Day Cells */}
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                    const blocks = (weekSchedule[dayOfWeek] || []).filter((block) => {
                      const startHour = parseInt(block.startTime.split(':')[0])
                      return startHour === hour
                    })

                    return (
                      <div 
                        key={dayOfWeek} 
                        className="min-h-[60px] p-1 border-l border-gray-200 relative"
                      >
                        {blocks.map((block) => {
                          const startMins = timeToMinutes(block.startTime)
                          const endMins = timeToMinutes(block.endTime)
                          const durationHours = (endMins - startMins) / 60
                          const height = Math.max(durationHours * 60, 58)

                          return (
                            <motion.div
                              key={block.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute left-1 right-1 border-2 border-secondary shadow-brutal-sm p-2 cursor-pointer group z-10"
                              style={{ 
                                backgroundColor: block.color || '#FFD700',
                                height: `${height}px`,
                              }}
                              onClick={() => handleEdit(block)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-bold text-xs uppercase truncate pr-6">
                                  {block.title}
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(block.id) }}
                                  className="absolute top-1 right-1 w-5 h-5 bg-white border border-secondary opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="font-mono text-xs">
                                {block.startTime} - {block.endTime}
                              </div>
                              {block.goal && (
                                <div className="mt-1 text-xs font-mono truncate">
                                  → {block.goal.title}
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-4">
        {SCHEDULE_CATEGORIES.map((cat) => (
          <div key={cat.value} className="flex items-center gap-2">
            <div className={`w-4 h-4 border-2 border-secondary ${cat.color}`} />
            <span className="font-mono text-sm uppercase">{cat.label}</span>
          </div>
        ))}
      </div>

      {/* Schedule Block Modal */}
      <ScheduleBlockModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={loadData}
        block={editingBlock}
        dayOfWeek={selectedDay}
        goals={goals}
      />
    </div>
  )
}

// Schedule Block Modal Component
function ScheduleBlockModal({
  isOpen,
  onClose,
  onSuccess,
  block,
  dayOfWeek,
  goals,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  block: ScheduleBlock | null
  dayOfWeek: number | null
  goals: Goal[]
}) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [category, setCategory] = useState('DEEP_WORK')
  const [selectedDays, setSelectedDays] = useState<number[]>([1])
  const [goalId, setGoalId] = useState('')
  const [color, setColor] = useState('#FFD700')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (block) {
      setTitle(block.title)
      setStartTime(block.startTime)
      setEndTime(block.endTime)
      setCategory(block.category)
      setSelectedDays([block.dayOfWeek])
      setGoalId(block.goalId || '')
      setColor(block.color)
    } else {
      resetForm()
      if (dayOfWeek !== null) setSelectedDays([dayOfWeek])
    }
  }, [block, dayOfWeek])

  const resetForm = () => {
    setTitle('')
    setStartTime('09:00')
    setEndTime('10:00')
    setCategory('DEEP_WORK')
    setSelectedDays(dayOfWeek !== null ? [dayOfWeek] : [1])
    setGoalId('')
    setColor('#FFD700')
  }

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        // Don't allow removing the last day
        if (prev.length === 1) return prev
        return prev.filter(d => d !== dayIndex)
      } else {
        return [...prev, dayIndex].sort((a, b) => a - b)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (block) {
        // When editing, only update the single block
        const data = {
          title,
          startTime,
          endTime,
          dayOfWeek: selectedDays[0],
          category,
          color,
          goalId: goalId || undefined,
        }
        await scheduleApi.update(block.id, data)
        toast.success('Block updated')
      } else {
        // When creating, create blocks for all selected days
        const createPromises = selectedDays.map(dayOfWeek => 
          scheduleApi.create({
            title,
            startTime,
            endTime,
            dayOfWeek,
            category,
            color,
            goalId: goalId || undefined,
          })
        )
        await Promise.all(createPromises)
        toast.success(`Block${selectedDays.length > 1 ? 's' : ''} created for ${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''}`)
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
            className="modal-brutal w-full max-w-lg relative z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold uppercase">
                {block ? 'Edit Block' : 'New Block'}
              </h2>
              <button onClick={onClose} className="w-10 h-10 border-3 border-secondary flex items-center justify-center hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold uppercase text-sm mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep Work"
                  className="input-brutal"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-2">
                  {block ? 'Day' : 'Days (select multiple)'}
                </label>
                {block ? (
                  <select
                    value={selectedDays[0]}
                    onChange={(e) => setSelectedDays([parseInt(e.target.value)])}
                    className="input-brutal"
                  >
                    {DAYS_OF_WEEK_FULL.map((d, i) => (
                      <option key={d} value={i}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK_FULL.map((d, i) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={cn(
                          "px-3 py-2 border-3 border-secondary font-bold uppercase text-sm transition-all",
                          selectedDays.includes(i)
                            ? "bg-primary shadow-brutal"
                            : "bg-white hover:bg-gray-100"
                        )}
                      >
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    const cat = SCHEDULE_CATEGORIES.find(c => c.value === e.target.value)
                    if (cat) {
                      const colorMap: Record<string, string> = {
                        'bg-primary': '#FFD700',
                        'bg-accent-green': '#22C55E',
                        'bg-accent-orange': '#F97316',
                        'bg-accent-pink': '#EC4899',
                        'bg-accent-purple': '#8B5CF6',
                        'bg-gray-300': '#D1D5DB',
                        'bg-gray-400': '#9CA3AF',
                      }
                      setColor(colorMap[cat.color] || '#FFD700')
                    }
                  }}
                  className="input-brutal"
                >
                  {SCHEDULE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-sm mb-2">Start Time</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-brutal"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-sm mb-2">End Time</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-brutal"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
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
                  {isLoading ? 'Saving...' : block ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
