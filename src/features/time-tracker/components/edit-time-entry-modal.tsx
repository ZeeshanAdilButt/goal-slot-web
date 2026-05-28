import { useEffect, useState } from 'react'

import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { useUpdateTimeEntry } from '@/features/time-tracker/hooks/use-time-tracker-mutations'
import { TimeEntry } from '@/features/time-tracker/utils/types'
import { Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-zinc-900">
            <Pencil className="h-5 w-5" />
            Edit Entry
          </DialogTitle>
        </DialogHeader>

        <form id="edit-entry-form" onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">
              Task Name <span className="text-[#f2cc0d]">*</span>
            </Label>
            <Input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
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
              <Label className="mb-1.5 block text-[10px] tracking-wider">Duration</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={23}
                  className="w-16 text-center"
                  placeholder="0"
                />
                <span className="text-xs font-semibold text-zinc-500">h</span>
                <Input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={59}
                  className="w-16 text-center"
                  placeholder="30"
                />
                <span className="text-xs font-semibold text-zinc-500">m</span>
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
                  'rounded-lg border px-2.5 py-1 font-mono text-xs transition-all',
                  totalDuration === min
                    ? 'bg-[#f2cc0d] border-yellow-400 text-zinc-900'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50',
                )}
              >
                {min >= 60 ? `${min / 60}h` : `${min}m`}
              </button>
            ))}
          </div>

          <div>
            <Label className="mb-1.5 flex items-center justify-between text-[10px] tracking-wider">
              <span>Notes</span>
              <span className="text-[10px] font-normal normal-case tracking-normal text-zinc-400">optional</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this session..."
              className="min-h-[60px]"
              rows={2}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-[10px] tracking-wider">Goal</Label>
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

        <DialogFooter className="flex-row gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-entry-form"
            variant="brand"
            disabled={updateEntry.isPending || totalDuration < 1}
            className="flex-1"
          >
            {updateEntry.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
