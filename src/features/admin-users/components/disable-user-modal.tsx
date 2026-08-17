'use client'

import { useState } from 'react'

import { Ban } from 'lucide-react'

import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loading } from '@/components/ui/loading'

import { User } from '../utils/types'

interface DisableUserModalProps {
  user: User
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export function DisableUserModal({ user, isSubmitting, onCancel, onConfirm }: DisableUserModalProps) {
  const [disableReason, setDisableReason] = useState('')

  return (
    <DialogContent className="max-w-md border border-zinc-200 bg-white shadow-sm" showCloseButton={true}>
      <DialogHeader className="border-b border-zinc-200 bg-red-500 p-4 text-white">
        <DialogTitle className="text-xl font-black uppercase">Disable User</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 p-2 sm:p-6">
        <p className="text-gray-600">
          You are about to disable <strong>{user.name}</strong> ({user.email}). They will not be able to log in until
          re-enabled.
        </p>
        <div>
          <label className="mb-2 block text-sm font-bold uppercase">Reason for Disabling *</label>
          <textarea
            value={disableReason}
            onChange={(e) => setDisableReason(e.target.value)}
            className="w-full border border-zinc-200 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., Violation of terms of service"
            rows={3}
            required
          />
        </div>
        <DialogFooter className="flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-zinc-200 px-4 py-2 font-bold transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(disableReason)}
            disabled={isSubmitting || !disableReason}
            className="flex flex-1 items-center justify-center gap-2 border border-zinc-200 bg-red-500 px-4 py-2 font-bold text-white shadow-sm transition-all hover:bg-red-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loading size="sm" className="h-5 w-5" />
            ) : (
              <>
                <Ban className="h-5 w-5" />
                Disable
              </>
            )}
          </button>
        </DialogFooter>
      </div>
    </DialogContent>
  )
}
