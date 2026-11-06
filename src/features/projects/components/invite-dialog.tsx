'use client'

import { useEffect, useMemo, useState, type ClipboardEvent, type KeyboardEvent } from 'react'

import { formatDistanceToNow } from 'date-fns'
import { Link2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import {
  useInviteLinkMutation,
  useProjectInvitesQuery,
  useResendInviteMutation,
  useRevokeInviteLinkMutation,
  useRevokeInviteMutation,
  useSendInvitesMutation,
} from '../hooks/use-projects'
import {
  addEmails,
  inviteButtonLabel,
  inviteLinkUrl,
  MAX_INVITE_EMAILS,
  summarizeInviteResult,
} from '../utils/invite-emails'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type ProjectRole, type ProjectSummary } from '../utils/types'

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: ProjectSummary
}

const ROLES: ProjectRole[] = ['ADMIN', 'MEMBER', 'GUEST']

function sentAgo(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}

export function InviteDialog({ open, onOpenChange, project }: InviteDialogProps) {
  const [emails, setEmails] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [role, setRole] = useState<ProjectRole>('MEMBER')
  const [linkRole, setLinkRole] = useState<'MEMBER' | 'GUEST'>('MEMBER')

  const invitesQuery = useProjectInvitesQuery(project.id, open)
  const sendInvites = useSendInvitesMutation(project.id)
  const inviteLink = useInviteLinkMutation(project.id)
  const revokeLink = useRevokeInviteLinkMutation(project.id)
  const resend = useResendInviteMutation(project.id)
  const revoke = useRevokeInviteMutation(project.id)

  useEffect(() => {
    if (open) {
      setEmails([])
      setDraft('')
      setProblem(null)
      setRole('MEMBER')
    }
  }, [open])

  const { pending, activeLink } = useMemo(() => {
    // "Now" is when the list was fetched, which keeps this render pure.
    const now = invitesQuery.dataUpdatedAt
    const all = invitesQuery.data ?? []
    const live = all.filter((i) => !i.acceptedAt && !i.revokedAt)
    return {
      pending: live.filter((i) => !!i.email),
      activeLink: live.find((i) => i.email === null && new Date(i.expiresAt).getTime() > now) ?? null,
    }
  }, [invitesQuery.data, invitesQuery.dataUpdatedAt])

  useEffect(() => {
    if (activeLink && (activeLink.role === 'MEMBER' || activeLink.role === 'GUEST')) setLinkRole(activeLink.role)
  }, [activeLink])

  const commit = (raw: string): string[] => {
    const result = addEmails(emails, raw)
    setEmails(result.emails)
    const messages: string[] = []
    if (result.invalid.length) {
      messages.push(
        result.invalid.length === 1
          ? `"${result.invalid[0]}" is not an email address.`
          : `${result.invalid.length} entries are not email addresses.`,
      )
    }
    if (result.overflow.length) messages.push(`You can invite up to ${MAX_INVITE_EMAILS} people at a time.`)
    setProblem(messages.length ? messages.join(' ') : null)
    setDraft(result.invalid.join(', '))
    return result.emails
  }

  const handleChange = (value: string) => {
    // Typing a separator ends an address: turn what is there into chips.
    if (/[,; ]$/.test(value)) {
      commit(value)
      return
    }
    setDraft(value)
    if (problem) setProblem(null)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && draft.trim()) {
      event.preventDefault()
      commit(draft)
    } else if (event.key === 'Backspace' && !draft && emails.length) {
      setEmails(emails.slice(0, -1))
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text')
    if (/[\s,;<]/.test(text)) {
      event.preventDefault()
      commit(`${draft} ${text}`)
    }
  }

  const send = async () => {
    const list = draft.trim() ? commit(draft) : emails
    if (list.length === 0) {
      setProblem('Add at least one email address.')
      return
    }
    try {
      const result = await sendInvites.mutateAsync({ emails: list, role })
      toast.success(summarizeInviteResult(result ?? {}))
      setEmails([])
      setDraft('')
    } catch {
      // toast shown by the mutation
    }
  }

  // Changing the role of a live link updates it in place (same token), so do
  // it right away rather than waiting for the next Copy.
  const changeLinkRole = (next: 'MEMBER' | 'GUEST') => {
    setLinkRole(next)
    if (activeLink && activeLink.role !== next) {
      inviteLink.mutate(next, { onSuccess: () => toast.success(`Link now joins as ${ROLE_LABELS[next]}`) })
    }
  }

  const copyLink = async () => {
    try {
      const invite = await inviteLink.mutateAsync(linkRole)
      if (!invite?.inviteLink) {
        toast.error('The link could not be created')
        return
      }
      const url = inviteLinkUrl(window.location.origin, invite.inviteLink)
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Invite link copied')
      } catch {
        // Clipboard can be blocked (permissions, insecure origin): show it instead.
        window.prompt('Copy this invite link', url)
      }
    } catch {
      // toast shown by the mutation
    }
  }

  const count = emails.length + (draft.trim() ? 1 : 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[640px]">
        <DialogHeader className="px-6 pb-0 pt-6 text-left">
          <DialogTitle className="pr-8 text-xl font-bold text-zinc-900">Invite people to {project.name}</DialogTitle>
          <DialogDescription className="text-[13px] text-zinc-600">
            They get an email with a link. Anyone who already has a GoalSlot or DW Platform account joins in one click.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="invite-emails" className="text-[13px] font-semibold text-zinc-900">
              Email addresses
            </label>
            <div
              className={cn(
                'flex min-h-12 flex-wrap items-center gap-1.5 rounded-lg border-[1.5px] px-2.5 py-2 focus-within:border-zinc-900',
                problem ? 'border-rose-500' : 'border-zinc-300',
              )}
            >
              {emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-1 pl-2 pr-1 text-[13px] text-zinc-900"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => setEmails(emails.filter((e) => e !== email))}
                    className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
                    aria-label={`Remove ${email}`}
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              ))}
              <input
                id="invite-emails"
                type="text"
                inputMode="email"
                autoComplete="off"
                value={draft}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => draft.trim() && commit(draft)}
                placeholder={emails.length ? 'Add more, separated by commas' : 'name@example.com, another@example.com'}
                aria-invalid={!!problem}
                aria-describedby={problem ? 'invite-emails-problem' : undefined}
                className="min-w-[180px] flex-1 border-0 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-500"
              />
            </div>
            {problem ? (
              <p id="invite-emails-problem" className="text-xs text-rose-700" role="alert">
                {problem}
              </p>
            ) : null}
          </div>

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="pb-2 text-[13px] font-semibold text-zinc-900">Role</legend>
            {ROLES.map((r) => {
              const checked = role === r
              return (
                <label
                  key={r}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-3.5 py-3 transition-colors focus-within:ring-2 focus-within:ring-[#f2cc0d]',
                    checked ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white hover:border-zinc-300',
                  )}
                >
                  <input
                    type="radio"
                    name="invite-role"
                    value={r}
                    checked={checked}
                    onChange={() => setRole(r)}
                    className="mt-0.5 h-[18px] w-[18px] accent-zinc-900"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-zinc-900">{ROLE_LABELS[r]}</span>
                    <span className="text-[13px] text-zinc-600">{ROLE_DESCRIPTIONS[r]}</span>
                  </span>
                </label>
              )
            })}
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3">
            <Link2 className="h-[18px] w-[18px] text-zinc-700" aria-hidden />
            <span className="flex min-w-[200px] flex-1 flex-col gap-0.5">
              <span className="text-[13px] font-semibold text-zinc-900">Invite link</span>
              <span className="text-xs text-zinc-600">
                Anyone with the link joins as {ROLE_LABELS[linkRole]}, expires in 7 days
              </span>
            </span>
            <Select value={linkRole} onValueChange={(v) => changeLinkRole(v as 'MEMBER' | 'GUEST')}>
              <SelectTrigger className="h-9 w-28 bg-white text-xs" aria-label="Role for people joining by link">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="GUEST">Guest</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="secondary" onClick={copyLink} disabled={inviteLink.isPending}>
              {inviteLink.isPending ? 'Copying...' : 'Copy link'}
            </Button>
            {activeLink ? (
              <Button
                type="button"
                variant="ghost"
                className="text-rose-700 hover:bg-rose-50"
                onClick={() => revokeLink.mutate()}
                disabled={revokeLink.isPending}
              >
                Turn off link
              </Button>
            ) : null}
          </div>

          <section aria-labelledby="pending-invites-heading" className="flex flex-col gap-1">
            <h3 id="pending-invites-heading" className="mb-1.5 text-[13px] font-semibold text-zinc-900">
              Pending invites
            </h3>
            {invitesQuery.isLoading ? (
              <p className="text-xs text-zinc-500">Loading...</p>
            ) : pending.length === 0 ? (
              <p className="text-xs text-zinc-500">No pending invites.</p>
            ) : (
              <ul className="flex flex-col">
                {pending.map((invite) => (
                  <li key={invite.id} className="flex min-h-11 flex-wrap items-center gap-2.5">
                    <span className="flex min-w-[200px] flex-1 flex-col">
                      <span className="text-[13px] text-zinc-900">{invite.email}</span>
                      <span className="text-xs text-zinc-600">
                        {ROLE_LABELS[invite.role]} · sent {sentAgo(invite.createdAt)}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => resend.mutate(invite.id)}
                      disabled={resend.isPending}
                      aria-label={`Resend invite to ${invite.email}`}
                    >
                      Resend
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-rose-700 hover:bg-rose-50"
                      onClick={() => revoke.mutate(invite.id)}
                      disabled={revoke.isPending}
                      aria-label={`Revoke invite to ${invite.email}`}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <span className="text-xs text-zinc-600">They see this project&apos;s tasks, never your personal ones.</span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" variant="brand" onClick={send} disabled={sendInvites.isPending || count === 0}>
              {sendInvites.isPending ? 'Sending...' : inviteButtonLabel(count)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
