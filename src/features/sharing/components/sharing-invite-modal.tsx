import { useEffect, useState } from 'react'

import { useCreatePublicLinkMutation } from '@/features/sharing/hooks/use-sharing-mutations'
import { sharingQueries } from '@/features/sharing/utils/queries'
import { AccessLevel, PublicLink, ShareInviteResult, ShareMode } from '@/features/sharing/utils/types'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Check, Copy, Globe, Link2, Mail, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { sharingApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type BatchInviteResult = {
  email: string
  status: 'sent' | 'failed' | 'duplicate'
  inviteLink?: string
  error?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmails(raw: string): string[] {
  const seen = new Set<string>()
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((e) => {
      if (seen.has(e)) return false
      seen.add(e)
      return true
    })
}

interface SharingInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SharingInviteModal({ isOpen, onClose, onSuccess }: SharingInviteModalProps) {
  const queryClient = useQueryClient()
  const [shareMode, setShareMode] = useState<ShareMode>('email')
  const [emailsInput, setEmailsInput] = useState('')
  const [batchResults, setBatchResults] = useState<BatchInviteResult[] | null>(null)
  const [isSending, setIsSending] = useState(false)
  // TODO: Implement EDIT access level functionality in the future
  // Currently, all shared users have VIEW-only access regardless of accessLevel setting
  // When implementing, add UI to select between VIEW and EDIT, and enforce permissions
  // in backend endpoints (POST/PUT/PATCH/DELETE operations for shared data)
  const [accessLevel] = useState<AccessLevel>('VIEW')
  const [expiresInDays, setExpiresInDays] = useState<number>(30)
  const [publicLinkResult, setPublicLinkResult] = useState<PublicLink | null>(null)

  const createPublicLinkMutation = useCreatePublicLinkMutation()

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setEmailsInput('')
      setShareMode('email')
      setExpiresInDays(30)
      setBatchResults(null)
      setIsSending(false)
      setPublicLinkResult(null)
    }
  }, [isOpen])

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    const emails = parseEmails(emailsInput)
    if (emails.length === 0) {
      toast.error('Enter at least one email address')
      return
    }

    const invalid = emails.filter((e) => !EMAIL_RE.test(e))
    if (invalid.length > 0) {
      toast.error(`Not a valid email: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '...' : ''}`)
      return
    }

    setIsSending(true)
    setBatchResults(null)
    // Send one at a time. Each share API call is cheap; doing them
    // serially keeps backend pressure low and lets us show progressive
    // results in the future without changing the wire shape.
    const results: BatchInviteResult[] = []
    for (const targetEmail of emails) {
      try {
        const res = await sharingApi.share({ email: targetEmail, accessLevel })
        const data = res.data as ShareInviteResult
        results.push({
          email: targetEmail,
          status: data.emailSent ? 'sent' : 'failed',
          inviteLink: data.inviteLink ?? undefined,
          error: data.emailSent ? undefined : 'Email delivery failed; copy the link below.',
        })
      } catch (err: any) {
        const msg: string = err?.response?.data?.message || err?.message || 'Failed'
        const isDuplicate = /already/i.test(msg)
        results.push({
          email: targetEmail,
          status: isDuplicate ? 'duplicate' : 'failed',
          error: msg,
        })
      }
    }
    setBatchResults(results)
    setIsSending(false)
    queryClient.invalidateQueries({ queryKey: sharingQueries.all })

    const sent = results.filter((r) => r.status === 'sent').length
    if (sent > 0) toast.success(`Invite${sent > 1 ? 's' : ''} sent to ${sent} ${sent > 1 ? 'people' : 'person'}`)
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

  const copyPublicLink = () => {
    if (publicLinkResult?.publicLink) {
      copyLink(publicLinkResult.publicLink)
    }
  }

  const hasResult = batchResults || publicLinkResult

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className=" max-w-md">
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
                'flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-colors',
                shareMode === 'email'
                  ? 'border-yellow-400 bg-yellow-50 text-zinc-900'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              )}
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm">Email Invite</span>
            </button>
            <button
              type="button"
              onClick={() => setShareMode('public-link')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-colors',
                shareMode === 'public-link'
                  ? 'border-yellow-400 bg-yellow-50 text-zinc-900'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
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
              <label className="mb-2 block text-xs font-bold uppercase sm:text-sm">
                Email Addresses
                <span className="ml-1 text-[10px] font-normal normal-case text-zinc-500">
                  (one per line, or comma-separated)
                </span>
              </label>
              <textarea
                value={emailsInput}
                onChange={(e) => setEmailsInput(e.target.value)}
                placeholder={'mentor1@example.com\nmentor2@example.com'}
                rows={4}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
                required
              />
              {emailsInput.trim().length > 0 && (
                <p className="mt-1 text-[11px] text-zinc-500">
                  {parseEmails(emailsInput).length} address{parseEmails(emailsInput).length === 1 ? '' : 'es'} parsed
                </p>
              )}
            </div>

            <div className="border border-zinc-200 bg-gray-50 p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-accent-orange mt-0.5 h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                <p className="font-mono text-xs text-gray-600 sm:text-sm">
                  Each invited person gets an email with a link. They must <strong>create an account</strong>{' '}
                  (or log in) and accept the invite to see your schedule, goals, time entries, and reports.
                  Private blocks stay hidden.
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
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>

            <div className="border border-zinc-200 bg-blue-50 p-3 sm:p-4">
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

        {/* Batch Email Invite Result */}
        {batchResults && (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {(() => {
              const sent = batchResults.filter((r) => r.status === 'sent').length
              const dupe = batchResults.filter((r) => r.status === 'duplicate').length
              const failed = batchResults.filter((r) => r.status === 'failed').length
              return (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-700">Summary</span>
                  <span className="ml-2 text-emerald-700">{sent} sent</span>
                  {dupe > 0 && <span className="ml-2 text-amber-700">· {dupe} already shared</span>}
                  {failed > 0 && <span className="ml-2 text-rose-700">· {failed} failed</span>}
                </div>
              )
            })()}
            {batchResults.map((r) => (
              <div
                key={r.email}
                className={cn(
                  'flex items-start gap-2 rounded-lg border p-2.5 text-xs',
                  r.status === 'sent' && 'border-emerald-200 bg-emerald-50',
                  r.status === 'duplicate' && 'border-amber-200 bg-amber-50',
                  r.status === 'failed' && 'border-rose-200 bg-rose-50',
                )}
              >
                {r.status === 'sent' ? (
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                ) : r.status === 'duplicate' ? (
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                ) : (
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-700" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-zinc-900">{r.email}</div>
                  <div className="text-[11px] text-zinc-600">
                    {r.status === 'sent' && 'Invite sent. They will see it in their inbox.'}
                    {r.status === 'duplicate' && 'Already has access or a pending invite — no action needed.'}
                    {r.status === 'failed' && (r.error || 'Failed to invite.')}
                  </div>
                  {r.inviteLink && r.status !== 'sent' && (
                    <button
                      type="button"
                      onClick={() => copyLink(r.inviteLink!)}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 underline-offset-2 hover:underline"
                    >
                      <Copy className="h-3 w-3" />
                      Copy invite link
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Public Link Result */}
        {publicLinkResult && (
          <div className="space-y-3">
            <div className="border border-zinc-200 bg-green-50 p-3 sm:p-4">
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

            <div className="border border-zinc-200 bg-gray-50 p-3 sm:p-4">
              <label className="mb-2 block text-xs font-bold uppercase sm:text-sm">Public Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}${publicLinkResult.publicLink}`}
                  className="h-10 w-full flex-1 rounded-lg border border-zinc-200 bg-white px-3 font-mono text-sm text-xs transition-colors placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
                />
                <button
                  type="button"
                  onClick={copyPublicLink}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-3 px-4 py-2 text-sm text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50 sm:px-4 sm:text-sm"
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
              <button type="button" onClick={onClose} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50 sm:text-sm">
                Cancel
              </button>
              <button
                type="submit"
                form="invite-form"
                disabled={isSending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm text-xs font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50 sm:text-sm"
              >
                {isSending ? 'Sending...' : 'Send Invites'}
              </button>
            </>
          )}
          {!hasResult && shareMode === 'public-link' && (
            <>
              <button type="button" onClick={onClose} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50 sm:text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePublicLink}
                disabled={createPublicLinkMutation.isPending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm text-xs font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50 sm:text-sm"
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm text-xs font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50 sm:text-sm"
            >
              Done
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
