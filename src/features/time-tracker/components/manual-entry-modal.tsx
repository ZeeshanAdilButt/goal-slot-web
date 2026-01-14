import { useEffect, useState } from 'react'

import { useCategoriesQuery } from '@/features/categories'
import { useCreateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { TaskSelector } from '@/features/time-tracker/components/task-selector'
import { buildLocalDateFromParts, findScheduleBlockForDateTime } from '@/features/time-tracker/utils/schedule'
import { filterTasks, getCategoryFromGoal, getGoalIdFromCategory, getTaskByGoalOrCategory } from '@/features/time-tracker/utils/selection-helpers'
import { Goal, Task } from '@/features/time-tracker/utils/types'
import { WeekSchedule } from '@/features/schedule/utils/types'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { cn, getLocalDateString, getLocalTimeString } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

  const createEntry = useCreateTimeEntry()
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategoriesQuery()
  const visibleTasks = filterTasks(tasks, category || undefined, goalId || undefined)

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].value)
    }
  }, [categories, category])

  // Reset date/time defaults whenever the modal opens so schedule detection uses the current local context
  useEffect(() => {
    if (isOpen) {
      setDate(getLocalDateString())
      setStartTime(getLocalTimeString())
    }
  }, [isOpen])

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

    if (!taskId && activeBlock.goalId) {
      setGoalId(activeBlock.goalId)
    }

    if (!taskId && !category && activeBlock.category) {
      setCategory(activeBlock.category)
    }

    if (!taskId && !title) {
      setTitle(activeBlock.title)
    }
  }, [isOpen, weeklySchedule, date, startTime, taskId, category, title])

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
      <DialogContent className="modal-brutal max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase">Manual Time Entry</DialogTitle>
        </DialogHeader>

        <form id="manual-entry-form" onSubmit={handleSubmit} className="space-y-4">
          <TaskSelector
            tasks={visibleTasks}
            currentTaskId={taskId}
            currentTask={title}
            timerState="STOPPED"
            onTaskIdChange={handleTaskIdChange}
            onTaskTitleChange={setTitle}
            onCreateTask={handleCreateTask}
            variant="light"
          />

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
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">
              Category {taskId && <span className="text-xs opacity-70">(From Task)</span>}
            </label>
            <Select
              value={category}
              onValueChange={(value) => {
                if (taskId) return
                setCategory(value)
                const linkedGoal = getGoalIdFromCategory(value, goals)
                setGoalId(linkedGoal)
                const linkedTask = getTaskByGoalOrCategory(tasks, linkedGoal || undefined, value)
                if (linkedTask) {
                  setTaskId(linkedTask.id)
                  setTitle(linkedTask.title)
                }
              }}
              disabled={!!taskId}
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

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">
              Link to Goal {taskId && goalId && <span className="text-xs opacity-70">(From Task)</span>}
            </label>
            <Select
              value={goalId || 'no_goal'}
              onValueChange={(value) => {
                if (taskId) return
                const normalized = value === 'no_goal' ? '' : value
                setGoalId(normalized)
                const derivedCategory = getCategoryFromGoal(normalized, goals)
                if (derivedCategory) {
                  setCategory(derivedCategory)
                }
                const linkedTask = getTaskByGoalOrCategory(tasks, normalized || undefined, derivedCategory || category)
                if (linkedTask) {
                  setTaskId(linkedTask.id)
                  setTitle(linkedTask.title)
                }
              }}
              disabled={!!taskId}
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
        </form>

        <DialogFooter className="flex-row gap-4 pt-4">
          <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
            Cancel
          </button>
          <button
            type="submit"
            form="manual-entry-form"
            disabled={createEntry.isPending}
            className="btn-brutal-dark flex-1"
          >
            {createEntry.isPending ? 'Adding...' : 'Add Entry'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
