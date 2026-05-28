import { useEffect, useState } from 'react'

import { CheckCircle, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Textarea } from '@/components/ui/textarea'

export interface StopTimerConfirmPayload {
  notes: string
  goalId: string
  category: string
  /** Edited task title — defaults to whatever the user was tracking,
      but they can correct it here before logging. */
  taskTitle: string
  /** Optional link to an existing task. If set, the entry is filed
      against that task; if not, only taskTitle is recorded. */
  taskId: string | null
}

interface StopTimerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (payload: StopTimerConfirmPayload) => void
  taskName: string
  duration: number
  isLoading?: boolean
  /** Goal / category / task options + the active defaults derived
      from the schedule block + current timer state. Pre-fills the
      modal so the user can save without touching anything, but can
      correct any link before logging. */
  goals: { id: string; title: string }[]
  categories: { value: string; name: string }[]
  tasks: { id: string; title: string }[]
  defaultGoalId: string
  defaultCategory: string
  defaultTaskId: string
}

export function StopTimerModal({
  isOpen,
  onClose,
  onConfirm,
  taskName,
  duration,
  isLoading,
  goals,
  categories,
  tasks,
  defaultGoalId,
  defaultCategory,
  defaultTaskId,
}: StopTimerModalProps) {
  const [notes, setNotes] = useState('')
  const [goalId, setGoalId] = useState(defaultGoalId)
  const [category, setCategory] = useState(defaultCategory)
  const [taskId, setTaskId] = useState(defaultTaskId)
  const [taskTitle, setTaskTitle] = useState(taskName)

  // Sync the modal's local state with the page each time it opens, so
  // closing + changing on the timer card + reopening doesn't show
  // stale values.
  useEffect(() => {
    if (isOpen) {
      setGoalId(defaultGoalId)
      setCategory(defaultCategory)
      setTaskId(defaultTaskId)
      setTaskTitle(taskName)
    }
  }, [isOpen, defaultGoalId, defaultCategory, defaultTaskId, taskName])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm({ notes, goalId, category, taskTitle: taskTitle.trim() || taskName, taskId: taskId || null })
    setNotes('')
  }

  const handleSkip = () => {
    onConfirm({ notes: '', goalId, category, taskTitle: taskTitle.trim() || taskName, taskId: taskId || null })
    setNotes('')
  }

  // When the user picks an existing task, pull its title into the
  // editable field so the two stay in sync. They can still edit
  // afterwards if they want to override the task's saved title for
  // this one entry only.
  const handleTaskIdChange = (next: string) => {
    setTaskId(next)
    if (next) {
      const picked = tasks.find((t) => t.id === next)
      if (picked) setTaskTitle(picked.title)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <CheckCircle className="h-5 w-5 text-[#8a7307]" />
            Session complete
          </DialogTitle>
        </DialogHeader>

        <form id="stop-timer-form" onSubmit={handleSubmit} className="space-y-3">
          {/* Duration summary — taskName lives inline above so the
              modal reads like "you spent 0h 42m on …", not as a header. */}
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-[#fffbea] px-3 py-2">
            <Clock className="h-4 w-4 text-[#8a7307]" />
            <span className="font-mono text-xl font-bold tabular-nums text-zinc-900">
              {formatDuration(duration)}
            </span>
            <span className="text-xs text-zinc-500">tracked</span>
          </div>

          {/* Editable task title — pre-filled with whatever the user
              was tracking. Defaults to the running task's title; user
              can correct here before saving without affecting the
              underlying task record. */}
          <div>
            <Label htmlFor="stop-task-title" className="text-[10px] tracking-wider">
              What were you working on?
            </Label>
            <Input
              id="stop-task-title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="h-9 text-sm"
            />
          </div>

          {/* Optional link to an existing task — defaults to the task
              you were tracking. Leave on "No task" to log a freeform
              entry not associated with any task record. */}
          <div>
            <Label className="text-[10px] tracking-wider">Link to task</Label>
            <SearchableSelect
              value={taskId || 'no_task'}
              onChange={(v) => handleTaskIdChange(v === 'no_task' ? '' : v)}
              placeholder="No task"
              options={[
                { value: 'no_task', label: 'No task — log as freeform' },
                ...tasks.map((t) => ({ value: t.id, label: t.title })),
              ]}
              triggerClassName="h-9 text-sm"
            />
          </div>

          {/* Goal + category link. Pre-filled from the active schedule
              block / current timer selection; user can override before
              saving so a session started without an explicit goal still
              lands on the right one. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-[10px] tracking-wider">Category</Label>
              <SearchableSelect
                value={category || 'no_category'}
                onChange={(v) => setCategory(v === 'no_category' ? '' : v)}
                placeholder="No category"
                options={[
                  { value: 'no_category', label: 'No category' },
                  ...categories.map((c) => ({ value: c.value, label: c.name })),
                ]}
                triggerClassName="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-[10px] tracking-wider">Goal</Label>
              <SearchableSelect
                value={goalId || 'no_goal'}
                onChange={(v) => setGoalId(v === 'no_goal' ? '' : v)}
                placeholder="No goal"
                options={[
                  { value: 'no_goal', label: 'No goal' },
                  ...goals.map((g) => ({ value: g.id, label: g.title })),
                ]}
                triggerClassName="h-9 text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="stop-timer-notes" className="text-[10px] tracking-wider">
              <span>Quick note</span>
              <span className="ml-1 font-normal normal-case text-zinc-400">optional</span>
            </Label>
            <Textarea
              id="stop-timer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you accomplish?"
              className="min-h-[72px] text-sm leading-relaxed"
              rows={3}
            />
          </div>
        </form>

        <DialogFooter className="flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSkip}
            disabled={isLoading}
            className="flex-1"
          >
            Skip note
          </Button>
          <Button
            type="submit"
            form="stop-timer-form"
            variant="brand"
            disabled={isLoading}
            className="flex-[2]"
          >
            {isLoading ? 'Saving…' : 'Save entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
