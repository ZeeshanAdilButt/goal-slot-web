'use client'

import { useNoteShareState } from '../hooks/use-note-share'

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

interface SharedWithPillProps {
  noteId: string
  onClick: () => void
}

// At-a-glance "this note is shared with N people" indicator that sits
// next to the Share button. Renders nothing if the note has no shares,
// so we don't add visual noise to private notes.
export function SharedWithPill({ noteId, onClick }: SharedWithPillProps) {
  const { data } = useNoteShareState(noteId)
  const shares = data?.shares ?? []
  if (shares.length === 0) return null

  const visible = shares.slice(0, 3)
  const extra = shares.length - visible.length
  const joinedCount = shares.filter((s) => s.acceptedAt).length
  const pendingCount = shares.length - joinedCount

  const summary = pendingCount > 0
    ? `Shared with ${shares.length} (${pendingCount} pending). Click to manage.`
    : `Shared with ${shares.length}. Click to manage.`

  return (
    <button
      type="button"
      onClick={onClick}
      title={summary}
      aria-label={summary}
      className="hidden h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-card px-2 text-xs font-medium transition-colors hover:bg-muted md:flex md:h-9"
    >
      <div className="flex -space-x-1.5">
        {visible.map((share) => {
          const user = share.recipientUser
          const initials = initialsFor(user?.name, share.recipientEmail)
          const palette = paletteFor(user?.id || share.recipientEmail)
          return user?.avatar ? (
            <img
              key={share.id}
              src={user.avatar}
              alt=""
              className="h-6 w-6 rounded-full object-cover ring-2 ring-card"
            />
          ) : (
            <span
              key={share.id}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ring-2 ring-card ${palette}`}
              aria-hidden
            >
              {initials}
            </span>
          )
        })}
        {extra > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-600 ring-2 ring-card">
            +{extra}
          </span>
        )}
      </div>
      <span className="hidden text-[11px] text-zinc-600 lg:inline">
        {shares.length}
        {pendingCount > 0 && (
          <span className="ml-1 text-amber-600">· {pendingCount} pending</span>
        )}
      </span>
    </button>
  )
}
