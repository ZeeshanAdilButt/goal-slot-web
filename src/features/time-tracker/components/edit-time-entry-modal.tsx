import { useEffect, useState } from 'react'

import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { useUpdateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { TimeEntry } from '@/features/time-tracker/utils/types'
import { Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EditTimeEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry: TimeEntry | null
}

export function EditTimeEntryModal({ isOpen, onClose, entry }: EditTimeEntryModalProps) {
  const [taskName, setTaskName] = useState('')
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(30)
  const [notes, setNotes] = useState('')
  const [goalId, setGoalId] = useState('')
  const [date, setDate] = useState('')

  const updateEntry = useUpdateTimeEntry()
  const { data: goals = [] } = useGoalsQuery()

  // Initialize form when entry changes
  useEffect(() => {
    if (entry) {
      setTaskName(entry.taskName || '')
      setHours(Math.floor((entry.duration || 0) / 60))
      setMinutes((entry.duration || 0) % 60)
      setNotes(entry.notes || '')
      setGoalId(entry.goalId || '')
      const entryDate = new Date(entry.date)
      setDate(entryDate.toISOString().split('T')[0])
    }
  }, [entry])

  // Auto-select goal if only one exists and entry has no goal
  useEffect(() => {
    if (isOpen && goals.length === 1 && !goalId && entry && !entry.goalId) {
      setGoalId(goals[0].id)
    }
  }, [isOpen, goals, goalId, entry])

  const totalDuration = hours * 60 + minutes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entry || totalDuration < 1) return

    updateEntry.mutate(
      {
        entryId: entry.id,
        data: {
          taskName,
          duration: totalDuration,
          notes: notes || undefined,
          goalId: goalId || undefined,
          date,
        },
      },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  const selectedGoal = goals.find((g: any) => g.id === goalId)

  if (!entry) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold uppercase">
            <Pencil className="h-5 w-5" />
            Edit Entry
          </DialogTitle>
        </DialogHeader>

        <form id="edit-entry-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="What did you work on?"
              className="input-brutal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="mb-2 block text-sm font-bold uppercase">Duration</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={23}
                  className="input-brutal w-16 text-center"
                  placeholder="0"
                />
                <span className="text-sm font-bold">h</span>
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={59}
                  className="input-brutal w-16 text-center"
                  placeholder="30"
                />
                <span className="text-sm font-bold">m</span>
              </div>
            </div>
          </div>

          {/* Quick duration buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[15, 30, 45, 60, 90, 120].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => {
                  setHours(Math.floor(min / 60))
                  setMinutes(min % 60)
                }}
                className={cn(
                  'rounded-sm border-2 border-secondary px-2.5 py-1 font-mono text-xs transition-all',
                  totalDuration === min ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100',
                )}
              >
                {min >= 60 ? `${min / 60}h` : `${min}m`}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-bold uppercase">
              <span>Notes</span>
              <span className="font-normal text-gray-400">optional</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this session..."
              className="input-brutal min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Goal</label>
            <Select value={goalId || 'no_goal'} onValueChange={(value) => setGoalId(value === 'no_goal' ? '' : value)}>
              <SelectTrigger className={cn(selectedGoal && 'border-l-4')} style={selectedGoal ? { borderLeftColor: selectedGoal.color } : undefined}>
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_goal">No Goal</SelectItem>
                {goals.map((goal: any) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: goal.color }} />
                      {goal.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter className="flex-row gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            form="edit-entry-form"
            disabled={updateEntry.isPending || totalDuration < 1}
            className="btn-brutal flex-[2] text-sm"
          >
            {updateEntry.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
