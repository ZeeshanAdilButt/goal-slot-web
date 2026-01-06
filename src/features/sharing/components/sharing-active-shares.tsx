import { SharingShareCard } from '@/features/sharing/components/sharing-share-card'
import { DataShare } from '@/features/sharing/utils/types'
import { Clock, Eye, Share2, Users } from 'lucide-react'

interface SharingActiveSharesProps {
  activeShares: DataShare[]
  pendingShares: DataShare[]
  onRevoke: (id: string) => void
}

export function SharingActiveShares({ activeShares, pendingShares, onRevoke }: SharingActiveSharesProps) {
  return (
    <div className="space-y-6">
      {/* Active Shares */}
      <div className="card-brutal">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold uppercase">
          <Users className="h-5 w-5" />
          People with Access ({activeShares.length})
        </h2>

        {activeShares.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Share2 className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="font-mono uppercase">No active shares</p>
            <p className="text-sm">Invite someone to view your data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeShares.map((share) => (
              <SharingShareCard key={share.id} share={share} onRevoke={() => onRevoke(share.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Pending Shares */}
      {pendingShares.length > 0 && (
        <div className="card-brutal">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold uppercase">
            <Clock className="h-5 w-5" />
            Pending Invites Sent ({pendingShares.length})
          </h2>

          <div className="space-y-3">
            {pendingShares.map((share) => (
              <SharingShareCard key={share.id} share={share} onRevoke={() => onRevoke(share.id)} isPending />
            ))}
          </div>
        </div>
      )}

      {/* Sharing Info */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card-brutal">
          <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
            <Eye className="h-5 w-5" />
            View Access
          </h3>
          <ul className="space-y-2 font-mono text-sm">
            <li>• View your goals and progress</li>
            <li>• See your time entries</li>
            <li>• Access your schedule</li>
            <li>• View reports and analytics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
