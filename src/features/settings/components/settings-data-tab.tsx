'use client'

import { useState } from 'react'

import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { usersApi } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loading } from '@/components/ui/loading'

export function SettingsDataTab() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) setConfirmText('')
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await usersApi.deleteAccount()
      toast.success('Account deleted')
      window.location.href = '/'
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-xl border border-red-500 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold uppercase text-red-600">
          <Trash2 className="h-5 w-5" />
          Danger Zone
        </h2>
        <p className="mb-4 font-mono text-gray-600">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
        >
          <Trash2 className="h-5 w-5" />
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              To confirm, type <span className="font-mono font-semibold">DELETE</span> below:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'DELETE' || isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loading className="h-4 w-4" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
