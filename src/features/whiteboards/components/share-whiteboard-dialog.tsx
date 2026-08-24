'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Globe, Link as LinkIcon, Mail, Send, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

import {
  useEnableWhiteboardPublicLinkMutation,
  useInviteWhiteboardShareMutation,
  useRevokeWhiteboardPublicLinkMutation,
  useRevokeWhiteboardShareMutation,
  useWhiteboardShareState,
} from '@/features/whiteboards/hooks/use-whiteboard-share'
import type { WhiteboardSummary } from '@/features/whiteboards/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'

interface ShareWhiteboardDialogProps {
  whiteboard: WhiteboardSummary
  open: boolean
  onClose: () => void
}

function buildPublicUrl(token: string): string {
  if (typeof window === 'undefined') return `/w/${token}`
  return `${window.location.origin}/w/${token}`
}

export function ShareWhiteboardDialog({ whiteboard, open, onClose }: ShareWhiteboardDialogProps) {
  const { data: state, isLoading } = useWhiteboardShareState(open ? whiteboard.id : null)
  const enablePublic = useEnableWhiteboardPublicLinkMutation(whiteboard.id)
  const revokePublic = useRevokeWhiteboardPublicLinkMutation(whiteboard.id)
  const invite = useInviteWhiteboardShareMutation(whiteboard.id)
  const revoke = useRevokeWhiteboardShareMutation(whiteboard.id)

  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) setEmail('')
  }, [open])

  const publicToken = state?.publicShareToken ?? null
  const publicUrl = publicToken ? buildPublicUrl(publicToken) : ''
  const isPublic = !!publicToken

  const handleCopy = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy. Select and copy manually.')
    }
  }

  const handleTogglePublic = () => {
    if (isPublic) {
      revokePublic.mutate()
    } else {
      enablePublic.mutate()
    }
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    invite.mutate(trimmed, {
      onSuccess: () => setEmail(''),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <LinkIcon className="h-4 w-4" />
            Share "{whiteboard.title || 'Untitled'}"
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            View only for recipients. You can revoke access at any time.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex h-24 items-center justify-center">
            <Loading size="sm" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            <section className="rounded-lg border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Public link</div>
                    <div className="text-[11px] text-zinc-500">
                      Anyone with the link can view this whiteboard
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isPublic ? 'secondary' : 'brand'}
                  onClick={handleTogglePublic}
                  disabled={enablePublic.isPending || revokePublic.isPending}
                >
                  {isPublic ? 'Turn off' : 'Turn on'}
                </Button>
              </div>
              {isPublic && (
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    readOnly
                    value={publicUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="h-8 text-xs"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Invite people</div>
                  <div className="text-[11px] text-zinc-500">
                    They will see this whiteboard in their Shared with me section. If they don't
                    have an account yet, they get an email with a sign-up link.
                  </div>
                </div>
              </div>

              <form onSubmit={handleInvite} className="mt-3 flex items-center gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-8 text-xs"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="brand"
                  disabled={invite.isPending || !email.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  Invite
                </Button>
              </form>

              {state && state.shares.length > 0 && (
                <ul className="mt-3 divide-y divide-zinc-100 rounded-md border border-zinc-100">
                  {state.shares.map((share) => (
                    <li
                      key={share.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-zinc-900">
                          {share.recipientEmail}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {share.acceptedAt
                            ? 'Joined'
                            : share.recipientUserId
                              ? 'Invited (existing user)'
                              : 'Invited (pending sign-up)'}
                          {' · View only'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => revoke.mutate(share.id)}
                        disabled={revoke.isPending}
                        title="Revoke access"
                        aria-label={`Revoke access for ${share.recipientEmail}`}
                        className="rounded p-1 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
