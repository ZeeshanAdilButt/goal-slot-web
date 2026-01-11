import { useEffect, useState } from 'react'

import { useCreatePublicLinkMutation, useShareMutation } from '@/features/sharing/hooks/use-sharing-mutations'
import { AccessLevel, PublicLink, ShareInviteResult, ShareMode } from '@/features/sharing/utils/types'
import { AlertCircle, Copy, Globe, Link2, Mail } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SharingInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SharingInviteModal({ isOpen, onClose, onSuccess }: SharingInviteModalProps) {
  const [shareMode, setShareMode] = useState<ShareMode>('email')
  const [email, setEmail] = useState('')
  // TODO: Implement EDIT access level functionality in the future
  // Currently, all shared users have VIEW-only access regardless of accessLevel setting
  // When implementing, add UI to select between VIEW and EDIT, and enforce permissions
  // in backend endpoints (POST/PUT/PATCH/DELETE operations for shared data)
  const [accessLevel] = useState<AccessLevel>('VIEW')
  const [expiresInDays, setExpiresInDays] = useState<number>(30)
  const [inviteResult, setInviteResult] = useState<ShareInviteResult | null>(null)
  const [publicLinkResult, setPublicLinkResult] = useState<PublicLink | null>(null)

  const shareMutation = useShareMutation()
  const createPublicLinkMutation = useCreatePublicLinkMutation()

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setEmail('')
      setShareMode('email')
      setExpiresInDays(30)
      setInviteResult(null)
      setPublicLinkResult(null)
    }
  }, [isOpen])

  const handleSubmitEmail = async (e: React.FormEvent) => {
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

  const handleCreatePublicLink = async () => {
    setPublicLinkResult(null)

    const result = await createPublicLinkMutation.mutateAsync({
      accessLevel,
      expiresInDays,
    })
    setPublicLinkResult(result)
  }

  const copyLink = (link: string) => {
    const fullUrl = `${window.location.origin}${link}`
    navigator.clipboard.writeText(fullUrl)
    toast.success('Link copied to clipboard!')
  }

  const copyInviteLink = () => {
    if (inviteResult?.inviteLink) {
      copyLink(inviteResult.inviteLink)
    }
  }

  const copyPublicLink = () => {
    if (publicLinkResult?.publicLink) {
      copyLink(publicLinkResult.publicLink)
    }
  }

  const hasResult = inviteResult || publicLinkResult

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase sm:text-2xl">Share Your Data</DialogTitle>
        </DialogHeader>

        {/* Mode Selector - Only show if no result yet */}
        {!hasResult && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShareMode('email')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 border-3 p-3 font-bold transition-colors',
                shareMode === 'email'
                  ? 'border-secondary bg-primary text-secondary'
                  : 'border-secondary bg-white hover:bg-gray-50'
              )}
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm">Email Invite</span>
            </button>
            <button
              type="button"
              onClick={() => setShareMode('public-link')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 border-3 p-3 font-bold transition-colors',
                shareMode === 'public-link'
                  ? 'border-secondary bg-primary text-secondary'
                  : 'border-secondary bg-white hover:bg-gray-50'
              )}
            >
              <Link2 className="h-4 w-4" />
              <span className="text-sm">Public Link</span>
            </button>
          </div>
        )}

        {/* Email Invite Form */}
        {shareMode === 'email' && !hasResult && (
          <form id="invite-form" onSubmit={handleSubmitEmail} className="space-y-3 sm:space-y-4">
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

            <div className="border-2 border-secondary bg-gray-50 p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-orange sm:h-5 sm:w-5" />
                <p className="font-mono text-xs text-gray-600 sm:text-sm">
                  The invited user will receive an email notification. They must <strong>create an account</strong>{' '}
                  (or log in) and accept the invite to gain access to your data.
                </p>
              </div>
            </div>
          </form>
        )}

        {/* Public Link Form */}
        {shareMode === 'public-link' && !hasResult && (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase sm:text-sm">Link Expires In</label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="input-brutal"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>

            <div className="border-2 border-secondary bg-blue-50 p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 sm:h-5 sm:w-5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-800 sm:text-base">Public Link</p>
                  <p className="font-mono text-xs text-blue-700 sm:text-sm">
                    Anyone with this link can view your data without needing an account.
                    The link will automatically expire after the selected duration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Invite Result */}
        {inviteResult && (
          <div className="space-y-3">
            {inviteResult.emailSent && (
              <div className="border-2 border-secondary bg-green-50 p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 sm:h-5 sm:w-5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-800 sm:text-base">Invitation sent successfully!</p>
                    <p className="font-mono text-xs text-green-700 sm:text-sm">
                      {email} will receive an email with the invitation. They must create an account or log in to accept.
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
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 font-mono text-[10px] text-gray-600 sm:text-xs">
                  Share this link with the recipient. They need to create an account to accept.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Public Link Result */}
        {publicLinkResult && (
          <div className="space-y-3">
            <div className="border-2 border-secondary bg-green-50 p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <Link2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 sm:h-5 sm:w-5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800 sm:text-base">Public link created!</p>
                  <p className="font-mono text-xs text-green-700 sm:text-sm">
                    Anyone with this link can view your data until{' '}
                    {new Date(publicLinkResult.expiresAt).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-secondary bg-gray-50 p-3 sm:p-4">
              <label className="mb-2 block text-xs font-bold uppercase sm:text-sm">Public Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}${publicLinkResult.publicLink}`}
                  className="input-brutal flex-1 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={copyPublicLink}
                  className="btn-brutal-secondary whitespace-nowrap px-3 text-xs sm:px-4 sm:text-sm"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 font-mono text-[10px] text-gray-600 sm:text-xs">
                Copy and share this link. No account required to view.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 pt-3 sm:gap-4 sm:pt-4">
          {!hasResult && shareMode === 'email' && (
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
          {!hasResult && shareMode === 'public-link' && (
            <>
              <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1 text-xs sm:text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePublicLink}
                disabled={createPublicLinkMutation.isPending}
                className="btn-brutal-dark flex-1 text-xs sm:text-sm"
              >
                {createPublicLinkMutation.isPending ? 'Creating...' : 'Create Link'}
              </button>
            </>
          )}
          {hasResult && (
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
