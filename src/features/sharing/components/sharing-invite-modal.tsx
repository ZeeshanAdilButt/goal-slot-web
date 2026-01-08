import { useEffect, useState } from 'react'

import { useShareMutation } from '@/features/sharing/hooks/use-sharing-mutations'
import { AccessLevel, ShareInviteResult } from '@/features/sharing/utils/types'
import { AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SharingInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SharingInviteModal({ isOpen, onClose, onSuccess }: SharingInviteModalProps) {
  const [email, setEmail] = useState('')
  // TODO: Implement EDIT access level functionality in the future
  // Currently, all shared users have VIEW-only access regardless of accessLevel setting
  // When implementing, add UI to select between VIEW and EDIT, and enforce permissions
  // in backend endpoints (POST/PUT/PATCH/DELETE operations for shared data)
  const [accessLevel] = useState<AccessLevel>('VIEW')
  const [inviteResult, setInviteResult] = useState<ShareInviteResult | null>(null)

  const shareMutation = useShareMutation()

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setEmail('')
      setInviteResult(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    setInviteResult(null)

    const result = await shareMutation.mutateAsync({
      email,
      accessLevel,
    })
    setInviteResult(result)
  }

  const copyInviteLink = () => {
    if (inviteResult?.inviteLink) {
      const fullUrl = `${window.location.origin}${inviteResult.inviteLink}`
      navigator.clipboard.writeText(fullUrl)
      toast.success('Invite link copied to clipboard!')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase sm:text-2xl">Invite User</DialogTitle>
        </DialogHeader>

        <form id="invite-form" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase sm:text-sm">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="input-brutal"
              required
            />
          </div>

          {!inviteResult && (
            <div className="border-2 border-secondary bg-gray-50 p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-orange sm:h-5 sm:w-5" />
                <p className="font-mono text-xs text-gray-600 sm:text-sm">
                  The invited user will receive an email notification. They must accept the invite to gain access.
                </p>
              </div>
            </div>
          )}

          {inviteResult && (
            <div className="space-y-3">
              {inviteResult.emailSent && (
                <div className="border-2 border-secondary bg-green-50 p-3 sm:p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 sm:h-5 sm:w-5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-green-800 sm:text-base">Invitation sent successfully!</p>
                      <p className="font-mono text-xs text-green-700 sm:text-sm">
                        {email} will receive an email with the invitation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!inviteResult.emailSent && (
                <div className="border-2 border-red-500 bg-red-50 p-3 sm:p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 sm:h-5 sm:w-5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-800 sm:text-base">Email failed to send</p>
                      <p className="font-mono text-xs text-red-700 sm:text-sm">
                        Please share the invite link manually with {email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {inviteResult.inviteLink && (
                <div className="border-2 border-secondary bg-gray-50 p-3 sm:p-4">
                  <label className="mb-2 block text-xs font-bold uppercase sm:text-sm">Invite Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}${inviteResult.inviteLink}`}
                      className="input-brutal flex-1 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="btn-brutal-secondary whitespace-nowrap px-3 text-xs sm:px-4 sm:text-sm"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-gray-600 sm:text-xs">
                    You can also share this link directly with the recipient
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
        <DialogFooter className="flex-row gap-2 pt-3 sm:gap-4 sm:pt-4">
          {!inviteResult && (
            <>
              <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1 text-xs sm:text-sm">
                Cancel
              </button>
              <button
                type="submit"
                form="invite-form"
                disabled={shareMutation.isPending}
                className="btn-brutal-dark flex-1 text-xs sm:text-sm"
              >
                {shareMutation.isPending ? 'Sending...' : 'Send Invite'}
              </button>
            </>
          )}
          {inviteResult && (
            <button
              type="button"
              onClick={() => {
                onSuccess()
                onClose()
              }}
              className="btn-brutal-dark flex-1 text-xs sm:text-sm"
            >
              Done
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
