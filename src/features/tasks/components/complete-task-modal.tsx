import { useEffect, useState } from 'react'

import { Task } from '@/features/tasks/utils/types'

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMinutes(initialMinutes > 0 ? initialMinutes.toString() : '')
      setNotes('')
    }
  }, [task])

  if (!task) return null

  const handleSubmit = async () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-md border-3 border-secondary bg-white p-6 shadow-brutal">
        <button className="absolute right-3 top-3 text-sm font-bold" onClick={onClose}>
          ✕
        </button>
        <h3 className="mb-4 font-display text-2xl font-bold uppercase">Complete "{task.title}"</h3>
        <div className="space-y-3">
          <div>
            <label className="font-mono text-sm uppercase">Minutes spent</label>
            <input
              type="number"
              min={1}
              className="input-brutal mt-1 w-full"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            {task.trackedMinutes ? (
              <p className="mt-1 font-mono text-xs text-gray-500">Tracked time: {task.trackedMinutes} mins</p>
            ) : null}
          </div>
          <div>
            <label className="font-mono text-sm uppercase">Note</label>
            <textarea
              className="input-brutal mt-1 w-full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-brutal-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-brutal" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Log & Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
