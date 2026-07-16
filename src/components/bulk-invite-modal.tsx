'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Check, Mail, Send, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'

import { usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/ui/loading'

interface BulkInviteRow {
  email: string
  status: 'invited' | 'already_user' | 'invalid' | 'failed'
  reason?: string
  userId?: string
}

interface BulkInviteResponse {
  total: number
  invited: number
  alreadyUsers: number
  invalid: number
  failed: number
  rows: BulkInviteRow[]
}

interface BulkInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

// Same permissive regex the server uses. Lets us show a live count of
// detected emails as the admin pastes, so they get instant feedback
// before they hit Send.
const EMAIL_TOKEN_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi

const STATUS_STYLES: Record<BulkInviteRow['status'], { label: string; bg: string; fg: string }> = {
  invited: { label: 'Invited', bg: 'bg-emerald-50', fg: 'text-emerald-700' },
  already_user: { label: 'Already a user', bg: 'bg-zinc-100', fg: 'text-zinc-600' },
  invalid: { label: 'Invalid', bg: 'bg-amber-50', fg: 'text-amber-700' },
  failed: { label: 'Failed', bg: 'bg-red-50', fg: 'text-red-700' },
}

export function BulkInviteModal({ isOpen, onClose, onComplete }: BulkInviteModalProps) {
  const [text, setText] = useState('')
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BulkInviteResponse | null>(null)

  // Live count of plausible emails the admin has pasted so far. Uses
  // the same regex the API uses to keep the displayed count honest;
  // dedupes case-insensitively so pasting the same address twice
  // doesn't inflate the number.
  const detectedCount = useMemo(() => {
    const matches = text.toLowerCase().match(EMAIL_TOKEN_RE) ?? []
    return new Set(matches).size
  }, [text])

  const handleClose = () => {
    if (submitting) return
    setText('')
    setRole('USER')
    setResult(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!text.trim() || detectedCount === 0) {
      toast.error('Paste at least one email address')
      return
    }
    setSubmitting(true)
    try {
      const res = await usersApi.bulkInvite({ text, role })
      const data = res.data as BulkInviteResponse
      setResult(data)
      if (data.invited > 0) {
        toast.success(`Sent ${data.invited} invitation${data.invited === 1 ? '' : 's'}`)
        onComplete?.()
      } else {
        toast(`No new invitations sent`, { icon: 'ℹ️' })
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Bulk invite failed'
      toast.error(typeof msg === 'string' ? msg : 'Bulk invite failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk invite users
          </DialogTitle>
          <DialogDescription>
            Paste any number of email addresses. Commas, spaces, newlines, semicolons, and {'<email@x.com>'} formats all work. Each invitee gets a pre-created account and an email with instructions to set their password.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs">Emails</Label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="alice@example.com, bob@example.com&#10;claire@example.com"
                rows={8}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
              />
              <div className="mt-1 text-[11px] text-zinc-500">
                {detectedCount === 0 ? (
                  'No emails detected yet'
                ) : (
                  <>
                    <span className="font-semibold text-zinc-900">{detectedCount}</span> email
                    {detectedCount === 1 ? '' : 's'} detected
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">Role for everyone in this batch</Label>
              <div className="flex gap-2">
                {(['USER', 'ADMIN'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      role === r
                        ? 'border-[#f2cc0d] bg-[#fffbea] text-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    {r === 'USER' ? 'Regular user' : 'Admin'}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Every invitee in this batch gets the same role. They land as INTERNAL users with PRO access (no payment needed).
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-600">
              <p className="mb-1 font-semibold text-zinc-900">What happens next</p>
              <ol className="ml-4 list-decimal space-y-0.5">
                <li>An account is pre-created for each new email.</li>
                <li>Existing users are skipped and reported as such.</li>
                <li>Each new invitee gets an email with a link to set their password.</li>
                <li>They log in and use the app normally.</li>
              </ol>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Summary label="Invited" value={result.invited} accent="emerald" icon={Check} />
              <Summary label="Existing" value={result.alreadyUsers} accent="zinc" icon={Mail} />
              <Summary label="Invalid" value={result.invalid} accent="amber" icon={AlertCircle} />
              <Summary label="Failed" value={result.failed} accent="red" icon={X} />
            </div>

            {result.rows.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200">
                <ul className="divide-y divide-zinc-100">
                  {result.rows.map((row, i) => {
                    const s = STATUS_STYLES[row.status]
                    return (
                      <li key={`${row.email}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <span className="min-w-0 flex-1 truncate font-mono text-zinc-900">{row.email}</span>
                        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.fg}`}>
                          {s.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {result.rows.some((r) => r.reason && (r.status === 'invalid' || r.status === 'failed')) && (
              <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-[11px] text-zinc-600">
                <summary className="cursor-pointer font-semibold text-zinc-900">Show error reasons</summary>
                <ul className="mt-2 space-y-1">
                  {result.rows
                    .filter((r) => r.reason && (r.status === 'invalid' || r.status === 'failed'))
                    .map((r, i) => (
                      <li key={i} className="font-mono">
                        <span className="text-zinc-700">{r.email}</span>
                        <span className="text-zinc-400"> : </span>
                        <span className="text-zinc-600">{r.reason}</span>
                      </li>
                    ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {!result && (
            <>
              <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="brand"
                onClick={handleSubmit}
                disabled={submitting || detectedCount === 0}
              >
                {submitting ? (
                  <>
                    <Loading size="sm" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Invite {detectedCount > 0 ? `${detectedCount} ` : ''}
                    {detectedCount === 1 ? 'person' : 'people'}
                  </>
                )}
              </Button>
            </>
          )}
          {result && (
            <Button variant="brand" onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Summary({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string
  value: number
  accent: 'emerald' | 'zinc' | 'amber' | 'red'
  icon: React.ComponentType<{ className?: string }>
}) {
  const styles = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    zinc: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  }[accent]
  return (
    <div className={`flex flex-col items-center gap-1 rounded-lg border p-2 ${styles}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </div>
  )
}
