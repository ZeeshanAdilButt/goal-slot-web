import { useEffect, useMemo, useState } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'

import { useCategoriesQuery } from '@/features/categories'
import { useCreateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { TaskSelector } from '@/features/time-tracker/components/task-selector'
import { buildLocalDateFromParts, findScheduleBlockForDateTime } from '@/features/time-tracker/utils/schedule'

import { getCategoryFromGoal, getGoalIdFromCategory, sortTasksBySelection } from '@/features/time-tracker/utils/selection-helpers'
import { Goal, Task } from '@/features/time-tracker/utils/types'
import { WeekSchedule } from '@/features/schedule/utils/types'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { cn, formatDuration, getLocalDateString, getLocalTimeString } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { tasksApi } from '@/lib/api'

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  goals: Goal[]
  tasks: Task[]
  weeklySchedule?: WeekSchedule
}

export function ManualEntryModal({ isOpen, onClose, goals, tasks, weeklySchedule }: ManualEntryModalProps) {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [category, setCategory] = useState('')
  const [goalId, setGoalId] = useState('')
  const [date, setDate] = useState(getLocalDateString())
  const [startTime, setStartTime] = useState(getLocalTimeString())
  const [taskId, setTaskId] = useState('')
  const [scheduleBlockId, setScheduleBlockId] = useState('')
  // Becomes true the moment the user makes any explicit change (picks a task,
  // changes the goal dropdown, types a custom title, edits category, etc).
  // Once true, the schedule auto-bind effect below stops snapping fields back
  // to the current-time schedule block.
  const [userOverride, setUserOverride] = useState(false)

  const createEntry = useCreateTimeEntry()
  const queryClient = useQueryClient()
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
    ...goals.map((goal) => ({
      value: goal.id,
      label: goal.title,
      color: goal.color,
    }))
  ], [goals])

  const orderedTasks = sortTasksBySelection(tasks, goalId || undefined, category || undefined)

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].value)
    }
  }, [categories, category])

  // Auto-select goal if only one exists
  useEffect(() => {
    if (goals.length === 1 && !goalId && !taskId) {
      setGoalId(goals[0].id)
    }
  }, [goals, goalId, taskId])

  // Reset date/time defaults AND override flag whenever the modal opens so
  // schedule detection uses the current local context.
  useEffect(() => {
    if (isOpen) {
      setDate(getLocalDateString())
      setStartTime(getLocalTimeString())
      setUserOverride(false)
    }
  }, [isOpen])

  // Schedule auto-bind: prefill goal/category/title from the schedule block
  // covering the chosen date+time, BUT only while the user hasn't made any
  // explicit choice yet. Once they override, we never snap back.
  useEffect(() => {
    if (!isOpen) {
      setScheduleBlockId('')
      return
    }

    if (!weeklySchedule) return

    const localDate = buildLocalDateFromParts(date, startTime)
    const activeBlock = findScheduleBlockForDateTime(weeklySchedule, localDate)

    if (!activeBlock) {
      setScheduleBlockId('')
      return
    }

    setScheduleBlockId(activeBlock.id)

    if (userOverride) return

    if (activeBlock.goalId) setGoalId(activeBlock.goalId)
    if (activeBlock.category) setCategory(activeBlock.category)
    if (!title) setTitle(activeBlock.title)
  }, [isOpen, weeklySchedule, date, startTime, userOverride, title])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const startedAt = startTime ? buildLocalDateFromParts(date, startTime).toISOString() : undefined
    const taskTitle = taskId ? tasks.find((t) => t.id === taskId)?.title || title : title

    createEntry.mutate({
      taskName: taskTitle,
      taskId: taskId || undefined,
      taskTitle,
      startedAt,
      duration,
      date,
      notes: `Manual entry`,
      goalId: goalId || undefined,
      scheduleBlockId: scheduleBlockId || undefined,
    })
    onClose()
    setTitle('')
    setDuration(30)
    setTaskId('')
    setScheduleBlockId('')
    setStartTime(getLocalTimeString())
  }

  const handleCreateTask = async (taskTitle: string): Promise<Task | null> => {
    try {
      const response = await tasksApi.create({
        title: taskTitle,
        goalId: goalId || undefined,
        category: category || undefined,
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['time-tracker'] })

      toast.success(`Task "${taskTitle}" created!`)
      return response.data as Task
    } catch (error) {
      toast.error('Failed to create task')
      return null
    }
  }

  const handleTaskIdChange = (id: string) => {
    setUserOverride(true)
    setTaskId(id)
    if (!id) return

    const selected = tasks.find((task) => task.id === id)
    if (selected) {
      setTitle(selected.title)
      if (selected.category) setCategory(selected.category)
      if (selected.goalId) setGoalId(selected.goalId)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-900">Manual Time Entry</DialogTitle>
        </DialogHeader>

        <form id="manual-entry-form" onSubmit={handleSubmit} className="space-y-3">
          <TaskSelector
            tasks={orderedTasks}
            currentTaskId={taskId}
            currentTask={title}
            timerState="STOPPED"
            onTaskIdChange={handleTaskIdChange}
            onTaskTitleChange={setTitle}
            onCreateTask={handleCreateTask}
            variant="light"
          />

          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">
              Task Title <span className="text-[#f2cc0d]">*</span>
            </Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you work on?"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[10px] tracking-wider">
                Date <span className="text-[#f2cc0d]">*</span>
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-[10px] tracking-wider">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">Duration (minutes)</Label>
            <div className="flex gap-2">
              {[15, 30, 45, 60, 90, 120].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDuration(min)}
                  className={cn(
                    'flex-1 rounded-lg border px-2 py-2 font-mono text-xs transition-all',
                    duration === min
                      ? 'bg-[#f2cc0d] border-yellow-400 text-zinc-900'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50',
                  )}
                >
                  {formatDuration(min)}
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-2 text-[10px] tracking-wider">
              Category
              {taskId && <span className="text-[10px] font-normal normal-case tracking-normal text-zinc-400">(from task)</span>}
            </Label>
            <SearchableSelect
              value={category}
              onChange={(value) => {
                if (taskId) return
                setUserOverride(true)
                setCategory(value)
                const linkedGoal = getGoalIdFromCategory(value, goals)
                if (linkedGoal) setGoalId(linkedGoal)
                // Intentionally do NOT auto-pick a task, let the user choose
                // from the (possibly multiple) DOING tasks for the goal.
              }}
              disabled={!!taskId}
              options={categoryOptions}
              placeholder="Select category"
            />
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-2 text-[10px] tracking-wider">
              Link to Goal
              {taskId && goalId && <span className="text-[10px] font-normal normal-case tracking-normal text-zinc-400">(from task)</span>}
            </Label>
            <SearchableSelect
              value={goalId || 'no_goal'}
              onChange={(value) => {
                if (taskId) return
                setUserOverride(true)
                const normalized = value === 'no_goal' ? '' : value
                setGoalId(normalized)
                const derivedCategory = getCategoryFromGoal(normalized, goals)
                if (derivedCategory) {
                  setCategory(derivedCategory)
                }
                // Intentionally do NOT auto-pick a task, let the user choose
                // from the (possibly multiple) DOING tasks for the goal.
              }}
              disabled={!!taskId}
              options={goalOptions}
              placeholder="Select goal"
            />
          </div>
        </form>

        <DialogFooter className="flex-row gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            form="manual-entry-form"
            variant="brand"
            disabled={createEntry.isPending}
            className="flex-1"
          >
            {createEntry.isPending ? 'Adding...' : 'Add Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
