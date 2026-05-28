import { PendingInvite } from '@/features/sharing/utils/types'
import { motion } from 'framer-motion'
import { Check, Mail, X } from 'lucide-react'

import { formatDate } from '@/lib/utils'

interface SharingPendingInvitesProps {
  invites: PendingInvite[]
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}

export function SharingPendingInvites({ invites, onAccept, onDecline }: SharingPendingInvitesProps) {
  if (invites.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm"
    >
      {/* Left accent stripe */}
      <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-amber-400" />

      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-zinc-900 sm:text-lg">
        <Mail className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />
        Pending invitations
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          {invites.length}
        </span>
      </h2>
      <p className="mb-4 text-xs text-zinc-600 sm:text-sm">People who want to share their reports with you.</p>

      <div className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-xs">
                Invitation from
              </div>
              <div className="truncate text-sm font-semibold text-zinc-900 sm:text-base">
                {invite.owner?.name || invite.ownerName}
              </div>
              <div className="truncate font-mono text-xs text-zinc-500 sm:text-sm">
                {invite.owner?.email || invite.ownerEmail}
              </div>
              <div className="mt-1 inline-flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-zinc-500 sm:text-xs">
                <span className="inline-flex items-center gap-1">
                  {invite.accessLevel === 'VIEW' ? '👁️ View their reports' : '📊 View their reports'}
                </span>
                <span aria-hidden>•</span>
                <span>{formatDate(invite.createdAt)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onAccept(invite.id)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 sm:px-4"
                title="Accept invitation"
              >
                <Check className="h-4 w-4" />
                Accept
              </button>
              <button
                onClick={() => onDecline(invite.id)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:border-zinc-300 sm:px-4"
                title="Decline invitation"
              >
                <X className="h-4 w-4" />
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
