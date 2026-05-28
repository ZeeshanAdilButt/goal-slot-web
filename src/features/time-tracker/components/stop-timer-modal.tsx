import { useEffect, useState } from 'react'

import { CheckCircle, Clock } from 'lucide-react'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface StopTimerConfirmPayload {
  notes: string
  goalId: string
  category: string
}

interface StopTimerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (payload: StopTimerConfirmPayload) => void
  taskName: string
  duration: number
  isLoading?: boolean
  /** Goal / category options + the active defaults derived from the
      schedule block the user is in. Pre-fills the modal so the user
      can save without touching anything, but can correct the link
      before logging. */
  goals: { id: string; title: string }[]
  categories: { value: string; name: string }[]
  defaultGoalId: string
  defaultCategory: string
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
  defaultGoalId,
  defaultCategory,
}: StopTimerModalProps) {
  const [notes, setNotes] = useState('')
  const [goalId, setGoalId] = useState(defaultGoalId)
  const [category, setCategory] = useState(defaultCategory)

  // Sync the modal's local goal/category with what the page thinks
  // they should be on every open, so closing + changing on the timer
  // card + reopening doesn't show stale values.
  useEffect(() => {
    if (isOpen) {
      setGoalId(defaultGoalId)
      setCategory(defaultCategory)
    }
  }, [isOpen, defaultGoalId, defaultCategory])

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
    onConfirm({ notes, goalId, category })
    setNotes('')
  }

  const handleSkip = () => {
    onConfirm({ notes: '', goalId, category })
    setNotes('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold uppercase">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Session Complete
          </DialogTitle>
        </DialogHeader>

        <form id="stop-timer-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Session summary card */}
          <div className="rounded-sm border border-zinc-200 bg-primary/10 p-4">
            <p className="mb-1 truncate text-base font-bold">{taskName}</p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="font-mono text-2xl font-black">{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Goal + category link. Pre-filled from the active schedule
              block / current timer selection; user can override before
              saving so a session started without an explicit goal still
              lands on the right one. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Category
              </label>
              <Select value={category || 'no_category'} onValueChange={(v) => setCategory(v === 'no_category' ? '' : v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_category">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Goal
              </label>
              <Select value={goalId || 'no_goal'} onValueChange={(v) => setGoalId(v === 'no_goal' ? '' : v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_goal">No goal</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-bold uppercase">
              <span>Quick Note</span>
              <span className="font-normal text-gray-400">optional</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you accomplish?"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] min-h-[80px] resize-none"
              rows={3}
              autoFocus
            />
          </div>
        </form>

        <DialogFooter className="flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-50 disabled:opacity-50 flex-1 text-sm"
            disabled={isLoading}
          >
            Skip note
          </button>
          <button
            type="submit"
            form="stop-timer-form"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-800 disabled:opacity-50 flex-[2] text-sm"
          >
            {isLoading ? 'Saving...' : 'Save Entry'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
