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

  const handleSubmit = () => {
    if (!task) return
    const mins = Number(minutes)
    if (!mins || mins < 1) return

    // Close immediately rather than waiting for the network round trip.
    // completeTaskMutation is a React Query mutation with an optimistic
    // onMutate: the task already flips to DONE in the cache the instant
    // this fires, synchronously, before any request has resolved - so
    // there is nothing left for this modal to wait for. If the save
    // genuinely fails, the mutation's own onError already rolls the cache
    // back and shows an error toast, entirely independent of whether this
    // modal is still open to see it happen.
    void onConfirm(task.id, mins, notes)
    onClose()
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
          <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50" onClick={onClose}>
            Cancel
          </button>
          <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800" onClick={handleSubmit}>
            Log &amp; Complete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
