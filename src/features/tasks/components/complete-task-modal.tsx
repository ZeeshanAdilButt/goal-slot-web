import { useEffect, useState } from 'react'

import { Task } from '@/features/tasks/utils/types'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CompleteTaskModalProps {
  task: Task | null
  onClose: () => void
  onConfirm: (taskId: string, minutes: number, notes?: string) => Promise<boolean>
}

export function CompleteTaskModal({ task, onClose, onConfirm }: CompleteTaskModalProps) {
  const [minutes, setMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (task) {
      // Pre-fill with tracked minutes if available, otherwise estimated
      const initialMinutes = task.trackedMinutes || task.estimatedMinutes || 0
      setMinutes(initialMinutes > 0 ? initialMinutes.toString() : '')
      setNotes('')
    }
  }, [task])

  const totalMinutes = Number(minutes) || 0
  const trackedMinutes = task?.trackedMinutes || 0
  const remainingMinutes = Math.max(0, totalMinutes - trackedMinutes)

  const handleSubmit = async () => {
    if (!task) return
    const mins = Number(minutes)
    if (!mins || mins < 1) return

    setIsSubmitting(true)
    const success = await onConfirm(task.id, mins, notes)
    setIsSubmitting(false)
    if (success) {
      onClose()
    }
  }

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className=" max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase">Complete "{task?.title}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="font-mono text-sm uppercase">Total minutes spent</label>
            <input
              type="number"
              min={1}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            {trackedMinutes > 0 && (
              <div className="mt-2 space-y-1 rounded border-2 border-gray-200 bg-gray-50 p-2">
                <p className="font-mono text-xs text-gray-600">
                  Already tracked: <span className="font-bold">{trackedMinutes} mins</span>
                </p>
                {totalMinutes > 0 && (
                  <>
                    <p className="font-mono text-xs text-gray-600">
                      Total time: <span className="font-bold">{totalMinutes} mins</span>
                    </p>
                    <p className="font-mono text-xs text-gray-600">
                      Will log additional: <span className="font-bold text-blue-600">{remainingMinutes} mins</span>
                    </p>
                    {remainingMinutes === 0 && totalMinutes > trackedMinutes && (
                      <p className="font-mono text-xs text-orange-600">
                        Note: All time already tracked. No additional entry will be created.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="font-mono text-sm uppercase">Note</label>
            <textarea
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex-row gap-3 pt-4">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-50 flex-1" onClick={onClose}>
            Cancel
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold px-4 py-2 transition-colors hover:bg-zinc-800 flex-1" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Log & Complete'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
