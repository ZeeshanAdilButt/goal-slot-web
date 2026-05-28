'use client'

import Link from 'next/link'

import { toast } from 'react-hot-toast'

/**
 * Shared error-to-toast handler for Coach streaming calls. 429 (token
 * budget exceeded) renders a clickable "Increase budget" link straight to
 * Settings, Integrations so the user can lift the cap in one click. 412
 * means their BYOK key was removed.
 */
export function showCoachStreamError(status: number | undefined, message: string) {
  if (status === 412) {
    toast.error('Your API key was removed. Reconnect it in Integrations.')
    return
  }
  if (status === 429 || /token budget/i.test(message)) {
    toast(
      (t) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-900">Monthly token budget exceeded.</span>
          <Link
            href="/dashboard/settings?tab=integrations"
            onClick={() => toast.dismiss(t.id)}
            className="font-semibold text-[#8a7307] underline underline-offset-2 hover:text-[#6b5905]"
          >
            Increase budget
          </Link>
        </div>
      ),
      { icon: '⚠️', duration: 6000 },
    )
    return
  }
  toast.error(message)
}

/**
 * Inline error fragment so persistent error text under the chat input / under
 * the narrative card carries the same "Increase budget" link as the toast.
 * Falls back to plain text for any non-budget error.
 */
export function CoachErrorText({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  const isBudget = /token budget|budget exceeded/i.test(message)
  if (!isBudget) {
    return <span className={className}>{message}</span>
  }
  return (
    <span className={className}>
      Monthly token budget exceeded.{' '}
      <Link
        href="/dashboard/settings?tab=integrations"
        className="font-semibold text-[#8a7307] underline underline-offset-2 hover:text-[#6b5905]"
      >
        Increase budget
      </Link>
    </span>
  )
}

export function statusOf(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status?: unknown }).status
    if (typeof s === 'number') return s
  }
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { status?: unknown } }).response
    if (r && typeof r.status === 'number') return r.status
  }
  return undefined
}
