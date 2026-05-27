import { UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

interface SharingHeaderProps {
  onCreateClick: () => void
  showInviteButton?: boolean
}

export function SharingHeader({ onCreateClick, showInviteButton = true }: SharingHeaderProps) {
  return (
    <PageHeader
      eyebrow="Collaboration"
      title="Sharing"
      description="Manage shared access and view shared reports"
      actions={
        showInviteButton ? (
          <Button onClick={onCreateClick} variant="brand">
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        ) : undefined
      }
    />
  )
}
