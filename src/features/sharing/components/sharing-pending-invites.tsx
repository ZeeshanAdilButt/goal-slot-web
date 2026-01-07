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
      className="card-brutal-colored bg-accent-orange text-white"
    >
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold uppercase sm:text-xl">
        <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-sm sm:text-base">Pending Invitations ({invites.length})</span>
      </h2>
      <p className="mb-4 text-xs opacity-80 sm:text-sm">People who want to share their reports with you</p>

      <div className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex flex-col gap-3 border border-white/30 bg-white/10 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-70 sm:text-xs">
                Invitation from
              </div>
              <div className="truncate text-sm font-bold sm:text-base">{invite.owner?.name || invite.ownerName}</div>
              <div className="truncate font-mono text-xs opacity-75 sm:text-sm">
                {invite.owner?.email || invite.ownerEmail}
              </div>
              <div className="mt-1 font-mono text-[10px] sm:text-xs">
                {invite.accessLevel === 'VIEW' ? '👁️ View their reports' : '📊 View their reports'} •{' '}
                {formatDate(invite.createdAt)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAccept(invite.id)}
                className="flex h-9 w-9 items-center justify-center border-2 border-white bg-white text-accent-green sm:h-10 sm:w-10"
                title="Accept invitation"
              >
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => onDecline(invite.id)}
                className="flex h-9 w-9 items-center justify-center border-2 border-white bg-white/20 text-white sm:h-10 sm:w-10"
                title="Decline invitation"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
