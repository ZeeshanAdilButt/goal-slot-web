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
    <div className="space-y-4 sm:space-y-6">
      {/* Active Shares */}
      <div className="card-brutal">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase sm:mb-6 sm:text-xl">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">People with Access ({activeShares.length})</span>
        </h2>

        {activeShares.length === 0 ? (
          <div className="py-6 text-center text-gray-500 sm:py-8">
            <Share2 className="mx-auto mb-3 h-10 w-10 opacity-50 sm:mb-4 sm:h-12 sm:w-12" />
            <p className="font-mono text-sm uppercase sm:text-base">No active shares</p>
            <p className="text-xs sm:text-sm">Invite someone to view your data</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {activeShares.map((share) => (
              <SharingShareCard key={share.id} share={share} onRevoke={() => onRevoke(share.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Pending Shares */}
      {pendingShares.length > 0 && (
        <div className="card-brutal">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase sm:mb-6 sm:text-xl">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Pending Invites Sent ({pendingShares.length})</span>
          </h2>

          <div className="space-y-2 sm:space-y-3">
            {pendingShares.map((share) => (
              <SharingShareCard key={share.id} share={share} onRevoke={() => onRevoke(share.id)} isPending />
            ))}
          </div>
        </div>
      )}

      {/* Sharing Info */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="card-brutal">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold uppercase sm:mb-4 sm:text-lg">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            View Access
          </h3>
          <ul className="space-y-1.5 font-mono text-xs sm:space-y-2 sm:text-sm">
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
