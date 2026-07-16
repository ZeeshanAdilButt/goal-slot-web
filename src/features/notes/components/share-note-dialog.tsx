'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Clock, Copy, Globe, Link as LinkIcon, Mail, Send, UserPlus, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'

import {
  useEnablePublicLinkMutation,
  useInviteShareMutation,
  useNoteShareState,
  useRevokePublicLinkMutation,
  useRevokeShareMutation,
  type NoteShareRecipient,
} from '@/features/notes/hooks/use-note-share'
import type { Note } from '@/features/notes/utils/types'
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

interface ShareNoteDialogProps {
  note: Note
  open: boolean
  onClose: () => void
}

function buildPublicUrl(token: string): string {
  if (typeof window === 'undefined') return `/n/${token}`
  return `${window.location.origin}/n/${token}`
}

// Deterministic pastel palette so each recipient keeps the same avatar
// color across renders without us having to persist anything.
const AVATAR_PALETTE = [
  'bg-rose-200 text-rose-800',
  'bg-amber-200 text-amber-800',
  'bg-emerald-200 text-emerald-800',
  'bg-sky-200 text-sky-800',
  'bg-violet-200 text-violet-800',
  'bg-fuchsia-200 text-fuchsia-800',
  'bg-cyan-200 text-cyan-800',
  'bg-indigo-200 text-indigo-800',
]

function paletteFor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function initialsFor(name: string | null | undefined, email: string): string {
  const source = (name || email.split('@')[0] || '?').trim()
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

interface ShareRowProps {
  share: NoteShareRecipient
  onRevoke: (id: string) => void
  isRevoking: boolean
}

function ShareRow({ share, onRevoke, isRevoking }: ShareRowProps) {
  const [confirming, setConfirming] = useState(false)
  const user = share.recipientUser
  const displayName = user?.name?.trim() || null
  const displayEmail = share.recipientEmail
  const isJoined = !!share.acceptedAt
  const isExistingButPending = !isJoined && !!share.recipientUserId
  const initials = initialsFor(displayName, displayEmail)
  const paletteKey = user?.id || displayEmail
  const palette = paletteFor(paletteKey)

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-zinc-200"
        />
      ) : (
        <span
          aria-hidden
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${palette}`}
        >
          {initials}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-zinc-900">
            {displayName || displayEmail}
          </span>
          {isJoined ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
              <Check className="h-2.5 w-2.5" />
              Joined
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-amber-700"
              title={isExistingButPending ? 'They have an account but have not opened the note yet' : 'They will see this note after they sign up'}
            >
              <Clock className="h-2.5 w-2.5" />
              Pending
            </span>
          )}
        </div>
        {displayName && (
          <div className="truncate text-[11px] text-zinc-500">{displayEmail}</div>
        )}
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-7 px-2 text-[11px]"
            onClick={() => {
              onRevoke(share.id)
              setConfirming(false)
            }}
            disabled={isRevoking}
          >
            Remove
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px]"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600"
          aria-label={`Revoke access for ${displayEmail}`}
        >
          Revoke
        </button>
      )}
    </li>
  )
}

export function ShareNoteDialog({ note, open, onClose }: ShareNoteDialogProps) {
  const { data: state, isLoading } = useNoteShareState(open ? note.id : null)
  const enablePublic = useEnablePublicLinkMutation(note.id)
  const revokePublic = useRevokePublicLinkMutation(note.id)
  const invite = useInviteShareMutation(note.id)
  const revoke = useRevokeShareMutation(note.id)

  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) setEmail('')
  }, [open])

  const publicToken = state?.publicShareToken ?? null
  const publicUrl = publicToken ? buildPublicUrl(publicToken) : ''
  const isPublic = !!publicToken

  const shares = state?.shares ?? []
  const { joined, pending } = useMemo(() => {
    const j: NoteShareRecipient[] = []
    const p: NoteShareRecipient[] = []
    for (const s of shares) (s.acceptedAt ? j : p).push(s)
    return { joined: j, pending: p }
  }, [shares])

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
    if (isPublic) revokePublic.mutate()
    else enablePublic.mutate()
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    invite.mutate(trimmed, { onSuccess: () => setEmail('') })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <LinkIcon className="h-4 w-4" />
            Share "{note.title || 'Untitled'}"
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Read-only for now. You can revoke access at any time.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex h-24 items-center justify-center">
            <Loading size="sm" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {/* Invite by email — first so the action is obvious */}
            <section className="rounded-lg border border-zinc-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-900">Invite people</div>
                  <div className="text-[11px] text-zinc-500">
                    They will see this note in their Shared with me section. If they don&apos;t have
                    an account yet, they get an email with a sign-up link.
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
            </section>

            {/* People with access */}
            <section className="rounded-lg border border-zinc-200 bg-white">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-zinc-500" />
                  <div className="text-sm font-semibold text-zinc-900">People with access</div>
                </div>
                {shares.length > 0 && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    {joined.length} joined
                    {pending.length > 0 && ` · ${pending.length} pending`}
                  </span>
                )}
              </div>

              {shares.length === 0 ? (
                <div className="flex flex-col items-center gap-1 px-3 py-6 text-center">
                  <UserPlus className="h-5 w-5 text-zinc-300" />
                  <p className="text-xs text-zinc-500">
                    No one has access yet. Invite someone above.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {[...joined, ...pending].map((share) => (
                    <ShareRow
                      key={share.id}
                      share={share}
                      onRevoke={(id) => revoke.mutate(id)}
                      isRevoking={revoke.isPending}
                    />
                  ))}
                </ul>
              )}
            </section>

            {/* Public link */}
            <section className="rounded-lg border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Public link</div>
                    <div className="text-[11px] text-zinc-500">
                      Anyone with the link can view this note
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
