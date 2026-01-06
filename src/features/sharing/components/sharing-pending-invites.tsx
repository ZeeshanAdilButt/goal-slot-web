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
      <h2 className="mb-2 flex items-center gap-2 text-xl font-bold uppercase">
        <Mail className="h-5 w-5" />
        Pending Invitations ({invites.length})
      </h2>
      <p className="mb-4 text-sm opacity-80">People who want to share their reports with you</p>

      <div className="space-y-3">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between border border-white/30 bg-white/10 p-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider opacity-70">Invitation from</div>
              <div className="font-bold">{invite.owner?.name || invite.ownerName}</div>
              <div className="font-mono text-sm opacity-75">{invite.owner?.email || invite.ownerEmail}</div>
              <div className="mt-1 font-mono text-xs">
                {invite.accessLevel === 'VIEW' ? '👁️ View their reports' : '📊 View their reports'} •{' '}
                {formatDate(invite.createdAt)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAccept(invite.id)}
                className="flex h-10 w-10 items-center justify-center border-2 border-white bg-white text-accent-green"
                title="Accept invitation"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDecline(invite.id)}
                className="flex h-10 w-10 items-center justify-center border-2 border-white bg-white/20 text-white"
                title="Decline invitation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
