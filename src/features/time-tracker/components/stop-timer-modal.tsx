import { useState } from 'react'

import { CheckCircle, Clock } from 'lucide-react'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface StopTimerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (notes: string) => void
  taskName: string
  duration: number
  isLoading?: boolean
}

export function StopTimerModal({ isOpen, onClose, onConfirm, taskName, duration, isLoading }: StopTimerModalProps) {
  const [notes, setNotes] = useState('')

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
    onConfirm(notes)
    setNotes('')
  }

  const handleSkip = () => {
    onConfirm('')
    setNotes('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className=" max-w-md">
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
            Skip
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
