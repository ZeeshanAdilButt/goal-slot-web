import { useEffect, useMemo, useState } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'

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
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [isPrivate, setIsPrivate] = useState(false)
  const [updateScope, setUpdateScope] = useState<ScheduleUpdateScope>('single')
  const { mutateAsync: createBlocks, isPending: isCreating } = useCreateScheduleBlocks()
  const { mutateAsync: updateBlock, isPending: isUpdating } = useUpdateScheduleBlock()
  const { data: goals = [], isPending: isGoalsPending } = useGoalsQuery({ status: 'ACTIVE' })
  const { data: categories = [] } = useCategoriesQuery()

  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.value,
      label: cat.name,
      color: cat.color,
    }))
  }, [categories])

  const goalOptions = useMemo(() => [
    { value: 'no_goal', label: 'No Goal' },
    ...goals.map((g) => ({
      value: g.id,
      label: g.title,
      color: g.color,
    }))
  ], [goals])

  const isSaving = isCreating || isUpdating
  const isSeriesEdit = Boolean(block && seriesBlockCount > 1)

  const resetForm = () => {
    setTitle('')
    setStartTime('09:00')
    setEndTime('10:00')
    setCategory(categories.length > 0 ? categories[0].value : '')
    setSelectedDays(dayOfWeek !== null ? [dayOfWeek] : [1])
    setGoalId('')
    setColor('#FFD700')
    setIsPrivate(false)
  }

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
      setIsPrivate(Boolean(block.isPrivate))
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

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].value)
      setColor(categories[0].color)
    }
  }, [categories, category])

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
        isPrivate,
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
      <DialogContent>
        <DialogHeader className="mb-2 flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-zinc-900">{block ? 'Edit Block' : 'New Block'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">
              Title <span className="text-[#f2cc0d]">*</span>
            </Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Work"
              required
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">{block ? 'Day' : 'Days (select multiple)'}</Label>
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
                      'rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all',
                      selectedDays.includes(i)
                        ? 'bg-[#f2cc0d] border-yellow-400 text-zinc-900'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50',
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
              <Label className="mb-1.5 block text-[10px] tracking-wider">Apply changes to</Label>
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
                      'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all',
                      updateScope === option.value
                        ? 'bg-[#f2cc0d] border-yellow-400 text-zinc-900'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                {updateScope === 'series'
                  ? 'Day assignments stay the same; other changes update across every linked block.'
                  : 'Only this specific block will be updated.'}
              </p>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">Category</Label>
            <SearchableSelect
              value={category}
              onChange={(value) => {
                setCategory(value)
                const cat = categories.find((c) => c.value === value)
                if (cat) {
                  setColor(cat.color)
                }
              }}
              options={categoryOptions}
              placeholder="Select category"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[10px] tracking-wider">Start Time</Label>
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
              <Label className="mb-1.5 block text-[10px] tracking-wider">End Time</Label>
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
            <Label className="mb-1.5 block text-[10px] tracking-wider">Link to Goal (Optional)</Label>
            <SearchableSelect
              value={goalId || 'no_goal'}
              onChange={(value) => setGoalId(value === 'no_goal' ? '' : value)}
              disabled={isGoalsPending}
              options={goalOptions}
              placeholder="Select goal"
            />
          </div>

          {/* Private toggle. When on, mentors / anyone the user has shared
              with do NOT see this block (or the time they tracked against
              it). The owner always sees it with a small lock indicator. */}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#f2cc0d]"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs font-semibold text-zinc-900">
                Private to me
              </span>
              <span className="text-[11px] leading-snug text-zinc-600">
                Hide this block (and the time tracked against it) from anyone
                I have shared my workspace with. Only I will see it.
              </span>
            </span>
          </label>

          <DialogFooter className="flex-row gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isSaving} className="flex-1">
              {isSaving ? 'Saving...' : block ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
