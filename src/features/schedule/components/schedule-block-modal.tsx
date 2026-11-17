import { useEffect, useId, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'

import { useCategoriesQuery } from '@/features/categories'
import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import {
  SET_DAYS_OFFLINE_MESSAGE,
  serverErrorMessage,
  useCreateScheduleBlocks,
  useSetScheduleBlockDays,
  useUpdateScheduleBlock,
} from '@/features/schedule/hooks/use-schedule-mutations'
import { hasFieldChanges } from '@/features/schedule/utils/block-edit'
import { describeConflict, findConflicts } from '@/features/schedule/utils/conflicts'
import {
  diffDays,
  formatDayList,
  getSeriesBlocks,
  replaceDay,
  seriesDays,
  summarizeDayDiff,
} from '@/features/schedule/utils/day-set'
import {
  addMinutesToTime,
  DURATION_CHIPS,
  durationMinutes,
  formatDuration,
  isEndAfterStart,
  shiftEndWithStart,
} from '@/features/schedule/utils/time-input'
import {
  ScheduleBlock,
  SchedulePayload,
  ScheduleUpdatePayload,
  ScheduleUpdateScope,
  WeekSchedule,
} from '@/features/schedule/utils/types'
import { onlineManager } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { cn, DAYS_OF_WEEK, DAYS_OF_WEEK_FULL } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { TimeField } from './time-field'

const generateSeriesId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

const MAX_CONFLICT_LINES = 4

type SeriesSnapshot = { ids: string[]; days: number[] }

type ScheduleBlockModalProps = {
  isOpen: boolean
  onClose: () => void
  block: ScheduleBlock | null
  dayOfWeek: number | null
  presetTimes?: { startTime: string; endTime: string } | null
  /** The weekly schedule the page already loaded; used for the series and the overlap preview. */
  weekSchedule?: WeekSchedule
}

export function ScheduleBlockModal({
  isOpen,
  onClose,
  block,
  dayOfWeek,
  presetTimes,
  weekSchedule = {},
}: ScheduleBlockModalProps) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  // Once the user sets the end themselves, moving the start no longer drags it along.
  const [endEdited, setEndEdited] = useState(false)
  const [category, setCategory] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([1])
  // Edit only: the day this block sits on (it can be moved), and the series as it was when the dialog opened.
  const [ownDay, setOwnDay] = useState(0)
  const [series, setSeries] = useState<SeriesSnapshot>({ ids: [], days: [] })
  const [showMove, setShowMove] = useState(false)
  const [goalId, setGoalId] = useState('')
  const [color, setColor] = useState('#FFD700')
  const [isPrivate, setIsPrivate] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  const [scopePromptOpen, setScopePromptOpen] = useState(false)
  const [scopeChoice, setScopeChoice] = useState<ScheduleUpdateScope>('single')
  const [isRunning, setIsRunning] = useState(false)
  const chipsLabelId = useId()
  const durationId = useId()
  const timeErrorId = useId()
  const { mutateAsync: createBlocks, isPending: isCreating } = useCreateScheduleBlocks()
  const { mutateAsync: updateBlock, isPending: isUpdating } = useUpdateScheduleBlock()
  const { mutateAsync: setBlockDays, isPending: isSettingDays } = useSetScheduleBlockDays()
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

  const isSaving = isCreating || isUpdating || isSettingDays || isRunning

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
    setEndEdited(false)
    setShowMove(false)
    setConfirmRemoveOpen(false)
    setScopePromptOpen(false)
    setScopeChoice('single')
    if (block) {
      const siblings = getSeriesBlocks(weekSchedule, block)
      const days = seriesDays(siblings)
      setSeries({ ids: siblings.map((b) => b.id), days })
      setOwnDay(block.dayOfWeek)
      setTitle(block.title)
      setStartTime(block.startTime)
      setEndTime(block.endTime)
      setCategory(block.category)
      // Edit starts from the block's whole series, so ticking and unticking
      // days reads as "where does this block repeat".
      setSelectedDays(days)
      setGoalId(block.goalId || '')
      setColor(block.color)
      setIsPrivate(Boolean(block.isPrivate))
    } else {
      setSeries({ ids: [], days: [] })
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

  const handleGoalChange = (value: string) => {
    const nextGoalId = value === 'no_goal' ? '' : value
    setGoalId(nextGoalId)
    // Picking a goal adopts that goal's category and colour. This used to be an
    // effect on goalId, which also fired when an existing block was opened and
    // made an untouched block look edited.
    const selectedGoal = goals.find((g) => g.id === nextGoalId)
    if (selectedGoal?.category) {
      setCategory(selectedGoal.category)
      const cat = categories.find((c) => c.value === selectedGoal.category)
      if (cat) setColor(cat.color)
    }
  }

  const toggleDay = (dayIndex: number) => {
    // The block's own day is what the API keeps the series anchored to, so it
    // stays ticked; moving the block to another day is a separate control.
    if (block && dayIndex === ownDay) return
    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev
        return prev.filter((d) => d !== dayIndex)
      }
      return [...prev, dayIndex].sort((a, b) => a - b)
    })
  }

  const moveBlockToDay = (nextDay: number) => {
    setSelectedDays((prev) => replaceDay(prev, ownDay, nextDay))
    setOwnDay(nextDay)
  }

  const handleStartCommit = (next: string) => {
    if (!endEdited) {
      const shifted = shiftEndWithStart(startTime, endTime, next)
      if (shifted) setEndTime(shifted)
    }
    setStartTime(next)
  }

  const handleEndCommit = (next: string) => {
    setEndTime(next)
    setEndEdited(true)
  }

  const handleDurationChip = (minutes: number) => {
    const next = addMinutesToTime(startTime, minutes)
    if (!next) return
    setEndTime(next)
    setEndEdited(false)
  }

  const minutes = durationMinutes(startTime, endTime)
  const isTimeValid = isEndAfterStart(startTime, endTime)
  const timeError = isTimeValid ? '' : 'End time must be after the start time, on the same day.'

  // Edit-only bookkeeping: what Save would do to the day set.
  const siblingCount = series.ids.length
  const originalOwnDay = block?.dayOfWeek ?? ownDay
  const moved = Boolean(block) && ownDay !== originalOwnDay
  const baseDays = useMemo(
    () => (block ? replaceDay(series.days, originalOwnDay, ownDay) : []),
    [block, series.days, originalOwnDay, ownDay],
  )
  const dayDiff = useMemo(
    () => (block ? diffDays(baseDays, selectedDays) : { added: [], removed: [] }),
    [block, baseDays, selectedDays],
  )
  const daysChanged = dayDiff.added.length > 0 || dayDiff.removed.length > 0
  const siblingDays = series.days.filter((d) => d !== originalOwnDay)
  const daySummary = block
    ? [moved ? `Moves this block from ${DAYS_OF_WEEK[originalOwnDay]} to ${DAYS_OF_WEEK[ownDay]}.` : '', summarizeDayDiff(dayDiff)]
        .filter(Boolean)
        .join(' ')
    : ''

  const conflictLines = useMemo(() => {
    if (!isTimeValid) return []
    let days = selectedDays
    let exclude = new Set<string>()
    if (block) {
      // Days that already hold a copy of this series only change when the
      // time does. Series members are excluded because an all-blocks save
      // replaces them and an only-this-block save leaves them untouched.
      const timesChanged = startTime !== block.startTime || endTime !== block.endTime
      days = selectedDays.filter((d) => d === ownDay || !baseDays.includes(d) || timesChanged)
      exclude = new Set([block.id, ...series.ids])
    }
    return findConflicts(weekSchedule, days, startTime, endTime, exclude).map((c) =>
      describeConflict(c, startTime, endTime),
    )
  }, [isTimeValid, selectedDays, block, startTime, endTime, ownDay, baseDays, series.ids, weekSchedule])

  const formFields = { title, startTime, endTime, category, color, goalId, isPrivate }

  const runCreate = async () => {
    const payloadBase: Omit<SchedulePayload, 'dayOfWeek'> = {
      title,
      startTime,
      endTime,
      category,
      color,
      goalId: goalId || undefined,
      isPrivate,
    }
    const sharedSeriesId = selectedDays.length > 1 ? generateSeriesId() : undefined
    const payloads = selectedDays.map(
      (day) =>
        ({
          ...payloadBase,
          dayOfWeek: day,
          ...(sharedSeriesId ? { seriesId: sharedSeriesId } : {}),
        }) satisfies SchedulePayload,
    )
    try {
      await createBlocks(payloads)
      toast.success(
        `Block${selectedDays.length > 1 ? 's' : ''} created for ${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''}`,
      )
      onClose()
    } catch {
      // useCreateScheduleBlocks already shows one specific toast (e.g. which
      // day conflicted), so toasting again here would double it.
    }
  }

  // Applies an edit in the order the server needs: field changes first (with the
  // chosen scope), then the day set in one atomic call. If the first part lands
  // and the second does not, say exactly what did and did not change.
  const runEdit = async (scope: ScheduleUpdateScope) => {
    if (!block) return
    const fieldsChanged = hasFieldChanges(block, formFields)
    const allBlocks = scope === 'series' && fieldsChanged
    let fieldsDone = false

    setIsRunning(true)
    try {
      if (fieldsChanged || moved) {
        const fields = {
          title,
          startTime,
          endTime,
          category,
          color,
          goalId: goalId || undefined,
          isPrivate,
        }
        if (allBlocks) {
          await updateBlock({ id: block.id, data: { ...fields, updateScope: 'series' } satisfies ScheduleUpdatePayload })
          fieldsDone = true
          if (moved) {
            await updateBlock({ id: block.id, data: { dayOfWeek: ownDay, updateScope: 'single' } })
          }
        } else {
          await updateBlock({
            id: block.id,
            data: { ...fields, dayOfWeek: ownDay, updateScope: 'single' } satisfies ScheduleUpdatePayload,
          })
        }
        fieldsDone = true
      }
    } catch (error) {
      const reason = serverErrorMessage(error) || 'Failed to save.'
      if (fieldsDone) {
        // Only reachable for an all-blocks save whose follow-up move failed.
        toast.error(
          `Updated all ${siblingCount} blocks, but moving this block to ${DAYS_OF_WEEK_FULL[ownDay]} failed (${reason}). The days were not changed.`,
          { duration: 9000 },
        )
        setIsRunning(false)
        onClose()
      } else {
        toast.error(`${reason} Nothing was changed.`)
        setIsRunning(false)
      }
      return
    }

    const fieldsPart = allBlocks
      ? `Updated all ${siblingCount} blocks`
      : moved && !fieldsChanged
        ? `Moved to ${DAYS_OF_WEEK_FULL[ownDay]}`
        : 'Block updated'

    if (daysChanged) {
      try {
        await setBlockDays({ id: block.id, days: selectedDays })
      } catch (error) {
        const reason = serverErrorMessage(error) || (error as Error)?.message || 'Unknown error.'
        if (fieldsDone) {
          toast.error(
            `${fieldsPart} was saved, but the days were not changed (${reason}). ` +
              `Open the block again to retry the day changes.`,
            { duration: 9000 },
          )
          setIsRunning(false)
          onClose()
        } else {
          toast.error(`The days were not changed and nothing was saved. ${reason}`, { duration: 7000 })
          setIsRunning(false)
        }
        return
      }
      toast.success(fieldsDone ? `${fieldsPart}. ${summarizeDayDiff(dayDiff)}` : `Days updated. ${summarizeDayDiff(dayDiff)}`)
    } else if (fieldsDone) {
      toast.success(fieldsPart)
    }

    setIsRunning(false)
    onClose()
  }

  // Past confirmation of any removal: ask "only this block, or all of them"
  // when other blocks of the series will still exist and a field changed.
  const continueEdit = () => {
    if (!block) return
    const keptSiblings = selectedDays.filter((d) => d !== ownDay && baseDays.includes(d)).length
    const asksScope = hasFieldChanges(block, formFields) && siblingCount > 1 && keptSiblings > 0
    if (asksScope) {
      setScopeChoice('single')
      setScopePromptOpen(true)
    } else {
      void runEdit('single')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving || !isTimeValid) return

    if (!block) {
      void runCreate()
      return
    }

    if (!hasFieldChanges(block, formFields) && !moved && !daysChanged) {
      onClose()
      return
    }
    if (daysChanged && !onlineManager.isOnline()) {
      toast.error(SET_DAYS_OFFLINE_MESSAGE)
      return
    }
    if (dayDiff.removed.length > 0) {
      setConfirmRemoveOpen(true)
      return
    }
    continueEdit()
  }

  const removedList = formatDayList(dayDiff.removed)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader className="mb-2 flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-zinc-900">{block ? 'Edit Block' : 'New Block'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="schedule-block-title" className="mb-1.5 block text-[10px] tracking-wider">
              Title <span className="text-[#f2cc0d]">*</span>
            </Label>
            <Input
              id="schedule-block-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Work"
              required
              className="h-11"
            />
          </div>

          <div>
            <Label id={chipsLabelId} className="mb-1.5 block text-[10px] tracking-wider">
              {block ? 'Repeats on' : 'Days (select multiple)'}
            </Label>
            <div role="group" aria-labelledby={chipsLabelId} className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK_FULL.map((d, i) => {
                const pressed = selectedDays.includes(i)
                const isOwn = Boolean(block) && i === ownDay
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    aria-pressed={pressed}
                    aria-label={d}
                    aria-disabled={isOwn || undefined}
                    title={isOwn ? 'This block’s own day. Use “Move to a different day” to change it.' : undefined}
                    className={cn(
                      'min-h-11 min-w-11 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d] focus-visible:ring-offset-1',
                      pressed
                        ? 'bg-[#f2cc0d] border-yellow-400 text-zinc-900'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50',
                      isOwn && 'ring-2 ring-zinc-900/70 ring-offset-1',
                    )}
                  >
                    {d.slice(0, 3)}
                    {isOwn && <span className="sr-only"> (this block, cannot be unticked)</span>}
                  </button>
                )
              })}
            </div>
            {block && (
              <div className="mt-1.5 space-y-1.5" aria-live="polite">
                <p className="text-[11px] text-zinc-600">
                  {daySummary ||
                    (siblingCount > 1
                      ? `This block repeats on ${formatDayList(series.days)}. Tick or untick days to add or remove copies.`
                      : 'Tick more days to add copies of this block there.')}
                </p>
              </div>
            )}
            {block && (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setShowMove((v) => !v)}
                  aria-expanded={showMove}
                  className="min-h-11 text-[11px] font-semibold text-zinc-700 underline underline-offset-2 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]"
                >
                  Move to a different day
                </button>
                {showMove && (
                  <div className="mt-1">
                    <Label htmlFor="schedule-block-move" className="mb-1.5 block text-[10px] tracking-wider">
                      Move this block to
                    </Label>
                    <Select value={ownDay.toString()} onValueChange={(value) => moveBlockToDay(parseInt(value))}>
                      <SelectTrigger id="schedule-block-move" className="h-11">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK_FULL.map((d, i) => (
                          <SelectItem key={d} value={i.toString()} disabled={siblingDays.includes(i)}>
                            {d}
                            {siblingDays.includes(i) ? ' (already has a copy)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-[11px] text-zinc-500">Only this block moves. Its other copies stay put.</p>
                  </div>
                )}
              </div>
            )}
          </div>

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

          <div>
            <div className="grid grid-cols-2 gap-3">
              <TimeField
                label="Start time"
                value={startTime}
                onCommit={handleStartCommit}
                invalid={!isTimeValid}
                describedBy={!isTimeValid ? timeErrorId : undefined}
              />
              <TimeField
                label="End time"
                value={endTime}
                onCommit={handleEndCommit}
                disableUpTo={startTime}
                invalid={!isTimeValid}
                describedBy={!isTimeValid ? timeErrorId : undefined}
              />
            </div>
            <p id={durationId} className="mt-1.5 text-xs text-zinc-600" aria-live="polite">
              Duration:{' '}
              <span className="font-semibold text-zinc-900">
                {isTimeValid && minutes !== null ? formatDuration(minutes) : '-'}
              </span>
            </p>
            <div role="group" aria-label="Set duration" className="mt-1.5 flex flex-wrap gap-1.5">
              {DURATION_CHIPS.map((chip) => {
                const fits = addMinutesToTime(startTime, chip.minutes) !== null
                const pressed = isTimeValid && minutes === chip.minutes
                return (
                  <button
                    key={chip.minutes}
                    type="button"
                    disabled={!fits}
                    aria-pressed={pressed}
                    aria-label={`${chip.label} (${formatDuration(chip.minutes)})`}
                    onClick={() => handleDurationChip(chip.minutes)}
                    className={cn(
                      'min-h-11 min-w-11 rounded-lg border px-3 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40',
                      pressed
                        ? 'bg-[#f2cc0d] border-yellow-400 text-zinc-900'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50',
                    )}
                  >
                    {chip.label}
                  </button>
                )
              })}
            </div>
            {timeError && (
              <p id={timeErrorId} role="alert" className="mt-1.5 text-[11px] font-medium text-rose-600">
                {timeError}
              </p>
            )}
          </div>

          {conflictLines.length > 0 && (
            <div
              role="status"
              className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 space-y-0.5">
                {conflictLines.slice(0, MAX_CONFLICT_LINES).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {conflictLines.length > MAX_CONFLICT_LINES && (
                  <p>and {conflictLines.length - MAX_CONFLICT_LINES} more.</p>
                )}
                <p className="text-amber-800/80">You can still save. The server makes the final call.</p>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">Link to Goal (Optional)</Label>
            <SearchableSelect
              value={goalId || 'no_goal'}
              onChange={handleGoalChange}
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
            <Button type="submit" variant="brand" disabled={isSaving || !isTimeValid} className="flex-1">
              {isSaving ? 'Saving...' : block ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>

        <ConfirmDialog
          open={confirmRemoveOpen}
          onOpenChange={setConfirmRemoveOpen}
          title="Remove blocks?"
          description={`This deletes this block's copy on ${removedList}. The other days stay as they are.`}
          confirmButtonText="Remove"
          variant="destructive"
          onConfirm={continueEdit}
        />

        <Dialog open={scopePromptOpen} onOpenChange={setScopePromptOpen}>
          <DialogContent showCloseButton={false} className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Update which blocks?</DialogTitle>
              <DialogDescription>This block repeats on {formatDayList(series.days)}.</DialogDescription>
            </DialogHeader>
            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Update</legend>
              {(
                [
                  { value: 'single', label: `Only this block (${DAYS_OF_WEEK[ownDay]})` },
                  { value: 'series', label: `All ${siblingCount} blocks` },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm text-zinc-900',
                    scopeChoice === option.value ? 'border-yellow-400 bg-[#fffbea]' : 'border-zinc-200 bg-white',
                  )}
                >
                  <input
                    type="radio"
                    name="schedule-update-scope"
                    value={option.value}
                    checked={scopeChoice === option.value}
                    onChange={() => setScopeChoice(option.value)}
                    className="h-4 w-4 accent-[#f2cc0d]"
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
            <DialogFooter className="mt-5 flex-row gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setScopePromptOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="brand"
                className="flex-1"
                onClick={() => {
                  setScopePromptOpen(false)
                  void runEdit(scopeChoice)
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
