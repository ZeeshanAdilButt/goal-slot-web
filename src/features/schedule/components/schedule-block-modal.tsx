import { useEffect, useState } from 'react'

import { useCategoriesQuery } from '@/features/categories'
import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { useCreateScheduleBlocks, useUpdateScheduleBlock } from '@/features/schedule/hooks/use-schedule-mutations'
import {
  ScheduleBlock,
  SchedulePayload,
  ScheduleUpdatePayload,
  ScheduleUpdateScope,
} from '@/features/schedule/utils/types'
import { toast } from 'react-hot-toast'

import { cn, DAYS_OF_WEEK_FULL, TIME_OPTIONS } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const generateSeriesId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

type ScheduleBlockModalProps = {
  isOpen: boolean
  onClose: () => void
  block: ScheduleBlock | null
  dayOfWeek: number | null
  presetTimes?: { startTime: string; endTime: string } | null
  seriesBlockCount?: number
}

export function ScheduleBlockModal({
  isOpen,
  onClose,
  block,
  dayOfWeek,
  presetTimes,
  seriesBlockCount = 0,
}: ScheduleBlockModalProps) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [category, setCategory] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([1])
  const [goalId, setGoalId] = useState('')
  const [color, setColor] = useState('#FFD700')
  const [updateScope, setUpdateScope] = useState<ScheduleUpdateScope>('single')
  const { mutateAsync: createBlocks, isPending: isCreating } = useCreateScheduleBlocks()
  const { mutateAsync: updateBlock, isPending: isUpdating } = useUpdateScheduleBlock()
  const { data: goals = [], isPending: isGoalsPending } = useGoalsQuery({ status: 'ACTIVE' })
  const { data: categories = [] } = useCategoriesQuery()

  const isSaving = isCreating || isUpdating
  const isSeriesEdit = Boolean(block && seriesBlockCount > 1)

  useEffect(() => {
    setUpdateScope('single')
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
    setCategory(categories.length > 0 ? categories[0].value : '')
    setSelectedDays(dayOfWeek !== null ? [dayOfWeek] : [1])
    setGoalId('')
    setColor('#FFD700')
  }

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].value)
      setColor(categories[0].color)
    }
  }, [categories, category])

  // Update category and color when a goal is selected
  useEffect(() => {
    if (goalId && goals.length > 0) {
      const selectedGoal = goals.find((g) => g.id === goalId)
      if (selectedGoal?.category) {
        setCategory(selectedGoal.category)
        const cat = categories.find((c) => c.value === selectedGoal.category)
        if (cat) {
          setColor(cat.color)
        }
      }
    }
  }, [goalId, goals, categories])

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
        const scopeToApply: ScheduleUpdateScope = isSeriesEdit ? updateScope : 'single'
        const updatePayload: ScheduleUpdatePayload = {
          ...payloadBase,
          updateScope: scopeToApply,
        }

        if (scopeToApply === 'single') {
          updatePayload.dayOfWeek = selectedDays[0]
        }

        await updateBlock({
          id: block.id,
          data: updatePayload,
        })

        const linkedCount = seriesBlockCount > 0 ? seriesBlockCount : 1
        toast.success(
          scopeToApply === 'series'
            ? `Updated ${linkedCount} linked block${linkedCount > 1 ? 's' : ''}`
            : 'Block updated',
        )
      } else {
        const sharedSeriesId = selectedDays.length > 1 ? generateSeriesId() : undefined
        const payloads = selectedDays.map(
          (day) =>
            ({
              ...payloadBase,
              dayOfWeek: day,
              ...(sharedSeriesId ? { seriesId: sharedSeriesId } : {}),
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
              <Select
                value={selectedDays[0].toString()}
                onValueChange={(value) => setSelectedDays([parseInt(value)])}
                disabled={isSeriesEdit && updateScope === 'series'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK_FULL.map((d, i) => (
                    <SelectItem key={d} value={i.toString()}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          {isSeriesEdit && (
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Apply changes to</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                {(
                  [
                    { label: 'This block only', value: 'single' as ScheduleUpdateScope },
                    {
                      label: `All ${seriesBlockCount} linked block${seriesBlockCount > 1 ? 's' : ''}`,
                      value: 'series' as ScheduleUpdateScope,
                    },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setUpdateScope(option.value)}
                    className={cn(
                      'flex-1 px-3 py-2 border-3 border-secondary text-sm font-bold uppercase transition-all',
                      updateScope === option.value ? 'bg-primary shadow-brutal' : 'bg-white hover:bg-gray-100',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 font-mono text-xs uppercase text-gray-600">
                {updateScope === 'series'
                  ? 'Day assignments stay the same; other changes update across every linked block.'
                  : 'Only this specific block will be updated.'}
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Category</label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value)
                const cat = categories.find((c) => c.value === value)
                if (cat) {
                  // Use the hex color directly
                  setColor(cat.color)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Start Time</label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">End Time</label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Link to Goal (Optional)</label>
            <Select
              value={goalId || 'no_goal'}
              onValueChange={(value) => setGoalId(value === 'no_goal' ? '' : value)}
              disabled={isGoalsPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_goal">No Goal</SelectItem>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
