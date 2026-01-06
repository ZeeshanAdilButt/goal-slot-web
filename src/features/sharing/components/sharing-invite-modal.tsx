import { useEffect, useState } from 'react'

import { useShareMutation } from '@/features/sharing/hooks/use-sharing-mutations'
import { AccessLevel, ShareInviteResult } from '@/features/sharing/utils/types'
import { AlertCircle, Edit3, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SharingInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SharingInviteModal({ isOpen, onClose, onSuccess }: SharingInviteModalProps) {
  const [email, setEmail] = useState('')
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('VIEW')
  const [inviteResult, setInviteResult] = useState<ShareInviteResult | null>(null)

  const shareMutation = useShareMutation()

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setEmail('')
      setAccessLevel('VIEW')
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

    if (result.emailSent) {
      // Close modal after a short delay if email succeeded
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    }
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
          <DialogTitle className="text-2xl font-bold uppercase">Invite User</DialogTitle>
        </DialogHeader>

        <form id="invite-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="input-brutal"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Access Level</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAccessLevel('VIEW')}
                className={cn(
                  'p-4 border-3 border-secondary text-left transition-all',
                  accessLevel === 'VIEW' ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100',
                )}
              >
                <Eye className="mb-2 h-6 w-6" />
                <div className="font-bold uppercase">View Only</div>
                <div className="font-mono text-xs text-gray-600">Can view your data</div>
              </button>
              <button
                type="button"
                onClick={() => setAccessLevel('EDIT')}
                className={cn(
                  'p-4 border-3 border-secondary text-left transition-all',
                  accessLevel === 'EDIT' ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100',
                )}
              >
                <Edit3 className="mb-2 h-6 w-6" />
                <div className="font-bold uppercase">Can Edit</div>
                <div className="font-mono text-xs text-gray-600">Can modify your data</div>
              </button>
            </div>
          </div>

          {!inviteResult && (
            <div className="border-2 border-secondary bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-orange" />
                <p className="font-mono text-sm text-gray-600">
                  The invited user will receive an email notification. They must accept the invite to gain access.
                </p>
              </div>
            </div>
          )}

          {inviteResult && (
            <div className="space-y-3">
              {!inviteResult.emailSent && (
                <div className="border-2 border-red-500 bg-red-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div className="flex-1">
                      <p className="font-bold text-red-800">Email failed to send</p>
                      <p className="font-mono text-sm text-red-700">
                        Please share the invite link manually with {email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {inviteResult.inviteLink && (
                <div className="border-2 border-secondary bg-gray-50 p-4">
                  <label className="mb-2 block text-sm font-bold uppercase">Invite Link</label>
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
                      className="btn-brutal-secondary whitespace-nowrap px-4"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 font-mono text-xs text-gray-600">
                    Share this link if email delivery failed or as a backup
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
        <DialogFooter className="flex-row gap-4 pt-4">
          {!inviteResult && (
            <>
              <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
                Cancel
              </button>
              <button
                type="submit"
                form="invite-form"
                disabled={shareMutation.isPending}
                className="btn-brutal-dark flex-1"
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
              className="btn-brutal-dark flex-1"
            >
              Done
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
