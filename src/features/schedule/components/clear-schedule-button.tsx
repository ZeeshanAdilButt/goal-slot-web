'use client'

import { useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { scheduleApi } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface ClearScheduleButtonProps {
  totalBlocks: number
}

// Destructive action: wipes every schedule block for the current user.
// Gated by a typed-confirm modal (user types "clear" to arm) because once
// the blocks are gone there is no undo. Time entries linked to these blocks
// are unlinked (onDelete: SetNull on the relation), not deleted, so the
// tracked hours survive.
export function ClearScheduleButton({ totalBlocks }: ClearScheduleButtonProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const queryClient = useQueryClient()

  if (totalBlocks === 0) return null

  const canConfirm = confirmText.trim().toLowerCase() === 'clear'

  const handleConfirm = async () => {
    if (!canConfirm) return
    setSubmitting(true)
    try {
      const { data } = await scheduleApi.clearAll()
      toast.success(
        `Cleared ${data.deleted} schedule ${data.deleted === 1 ? 'block' : 'blocks'}`,
      )
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
      queryClient.invalidateQueries({ queryKey: ['time-tracker'] })
      setOpen(false)
      setConfirmText('')
    } catch {
      toast.error('Failed to clear schedule. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    setOpen(false)
    setConfirmText('')
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title="Delete every schedule block for your account"
        className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear all
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Clear all schedule blocks"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:rounded-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-rose-200 bg-rose-50 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                    Destructive action
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-zinc-900">
                    Clear all schedule blocks
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                title="Close"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="space-y-3 px-4 py-4">
              <p className="text-sm text-zinc-700">
                This will permanently delete <strong>all {totalBlocks}</strong>{' '}
                of your schedule blocks. There is no undo.
              </p>
              <ul className="space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600">
                <li>
                  <span className="font-semibold text-zinc-800">Your goals and tasks</span> are kept.
                </li>
                <li>
                  <span className="font-semibold text-zinc-800">Your tracked time</span> is kept; the
                  time entries are just unlinked from the deleted blocks.
                </li>
                <li>
                  After clearing you can import a fresh template from the{' '}
                  <span className="font-semibold text-zinc-800">Library</span> or build a new schedule from scratch.
                </li>
              </ul>
              <div>
                <label
                  htmlFor="clear-schedule-confirm"
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-600"
                >
                  Type <span className="font-mono text-rose-700">clear</span> to confirm
                </label>
                <input
                  id="clear-schedule-confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm || submitting}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-rose-500 px-3 text-xs font-bold text-white shadow-sm hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                {submitting ? 'Clearing...' : `Delete all ${totalBlocks} blocks`}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
