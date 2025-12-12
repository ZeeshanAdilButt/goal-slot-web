import { useEffect, useState } from 'react'

import { useCreateScheduleBlocks, useUpdateScheduleBlock } from '@/features/schedule/hooks/use-schedule-mutations'
import { useActiveGoals } from '@/features/schedule/hooks/use-schedule-queries'
import { ScheduleBlock, SchedulePayload } from '@/features/schedule/utils/types'
import { toast } from 'react-hot-toast'

import { cn, DAYS_OF_WEEK_FULL, SCHEDULE_CATEGORIES, TIME_OPTIONS } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ScheduleBlockModalProps = {
  isOpen: boolean
  onClose: () => void
  block: ScheduleBlock | null
  dayOfWeek: number | null
  presetTimes?: { startTime: string; endTime: string } | null
}

export function ScheduleBlockModal({ isOpen, onClose, block, dayOfWeek, presetTimes }: ScheduleBlockModalProps) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [category, setCategory] = useState('DEEP_WORK')
  const [selectedDays, setSelectedDays] = useState<number[]>([1])
  const [goalId, setGoalId] = useState('')
  const [color, setColor] = useState('#FFD700')
  const { mutateAsync: createBlocks, isPending: isCreating } = useCreateScheduleBlocks()
  const { mutateAsync: updateBlock, isPending: isUpdating } = useUpdateScheduleBlock()
  const { data: goals = [], isPending: isGoalsPending } = useActiveGoals()

  const isSaving = isCreating || isUpdating

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
      if (presetTimes) {
        setStartTime(presetTimes.startTime)
        setEndTime(presetTimes.endTime)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block, dayOfWeek, presetTimes])

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
    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev
        return prev.filter((d) => d !== dayIndex)
      }
      return [...prev, dayIndex].sort((a, b) => a - b)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payloadBase: Omit<SchedulePayload, 'dayOfWeek'> = {
        title,
        startTime,
        endTime,
        category,
        color,
        goalId: goalId || undefined,
      }

      if (block) {
        await updateBlock({
          id: block.id,
          data: {
            ...payloadBase,
            dayOfWeek: selectedDays[0],
          },
        })
        toast.success('Block updated')
      } else {
        const payloads = selectedDays.map(
          (day) =>
            ({
              ...payloadBase,
              dayOfWeek: day,
            }) satisfies SchedulePayload,
        )
        await createBlocks(payloads)
        toast.success(
          `Block${selectedDays.length > 1 ? 's' : ''} created for ${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''}`,
        )
      }

      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal">
        <DialogHeader className="mb-2 flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold uppercase">{block ? 'Edit Block' : 'New Block'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Title</label>
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
            <label className="mb-2 block text-sm font-bold uppercase">{block ? 'Day' : 'Days (select multiple)'}</label>
            {block ? (
              <select
                value={selectedDays[0]}
                onChange={(e) => setSelectedDays([parseInt(e.target.value)])}
                className="input-brutal"
              >
                {DAYS_OF_WEEK_FULL.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
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
                      'px-3 py-2 border-3 border-secondary font-bold uppercase text-sm transition-all',
                      selectedDays.includes(i) ? 'bg-primary shadow-brutal' : 'bg-white hover:bg-gray-100',
                    )}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                const cat = SCHEDULE_CATEGORIES.find((c) => c.value === e.target.value)
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
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Start Time</label>
              <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-brutal">
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">End Time</label>
              <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-brutal">
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Link to Goal (Optional)</label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="input-brutal"
              disabled={isGoalsPending}
            >
              <option value="">No Goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="flex-row gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn-brutal-dark flex-1">
              {isSaving ? 'Saving...' : block ? 'Update' : 'Create'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
