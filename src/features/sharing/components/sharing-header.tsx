import { UserPlus } from 'lucide-react'

interface SharingHeaderProps {
  onCreateClick: () => void
  showInviteButton?: boolean
}

export function SharingHeader({ onCreateClick, showInviteButton = true }: SharingHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase sm:text-4xl">Sharing</h1>
        <p className="font-mono text-xs uppercase text-gray-600 sm:text-sm">
          Manage shared access and view shared reports
        </p>
      </div>

      {showInviteButton && (
        <button onClick={onCreateClick} className="btn-brutal flex items-center justify-center gap-2 sm:w-auto">
          <UserPlus className="h-5 w-5" />
          <span>Invite User</span>
        </button>
      )}
    </div>
  )
}
