import { UserPlus } from 'lucide-react'

interface SharingHeaderProps {
  onCreateClick: () => void
  showInviteButton?: boolean
}

export function SharingHeader({ onCreateClick, showInviteButton = true }: SharingHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase">Sharing</h1>
        <p className="font-mono uppercase text-gray-600">Manage shared access and view shared reports</p>
      </div>

      {showInviteButton && (
        <button onClick={onCreateClick} className="btn-brutal flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite User
        </button>
      )}
    </div>
  )
}
