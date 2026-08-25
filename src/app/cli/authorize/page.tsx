'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { AlertTriangle, Check, Copy, Loader2, Monitor, ShieldAlert, Terminal, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { cliAuthApi, type CliApproveResult, type CliSessionMetadata } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GoalSlotBrand } from '@/components/goalslot-logo'

/**
 * Approval page for `goalslot login`.
 *
 * Reached three ways:
 *   /cli/authorize?session=<uuid>      loopback, the CLI opened this itself
 *   /cli/authorize?user_code=XXXX-XXXX device deep link
 *   /cli/authorize                     device, the user types the code
 *
 * `user_code` is snake_case because it is an RFC 8628 style deep link the user
 * may read off a terminal and type by hand; everything else on the wire is
 * camelCase like the rest of this app.
 */

/** Device mode disables Approve briefly so a lure link cannot ride a mis-click. */
const DEVICE_APPROVE_DELAY_MS = 3000

/** How long before we offer the copyable code as a loopback fallback. */
const REDIRECT_FALLBACK_MS = 3000

type Phase = 'loading' | 'code-entry' | 'review' | 'approved' | 'denied' | 'invalid'

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'expired'
  const totalSeconds = Math.floor(msRemaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function relativeFromNow(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.round(seconds / 60)
  return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
}

function CliAuthorizeInner() {
  const router = useRouter()
  const params = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const sessionParam = params.get('session')
  const userCodeParam = params.get('user_code')

  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<CliSessionMetadata | null>(null)
  const [invalidReason, setInvalidReason] = useState<string>('')
  const [codeInput, setCodeInput] = useState(userCodeParam ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [approveUnlockedAt, setApproveUnlockedAt] = useState<number | null>(null)
  const [fallback, setFallback] = useState<CliApproveResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Guards the one-shot lookup effect below against React 18 strict-mode's
  // double invoke, which would otherwise burn two of the five device-code
  // attempts before the user has done anything wrong.
  const lookupStarted = useRef(false)

  // Ticks the countdown. Cheap, and the expiry is the single most useful thing
  // on this page: a stale approval card is exactly what a lure link looks like.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Not signed in: bounce through login and come straight back here. Password
  // login already honoured ?redirect; Google now carries it across the OAuth
  // round trip too (see lib/post-login-redirect.ts).
  useEffect(() => {
    if (isAuthenticated) return
    if (typeof window === 'undefined') return
    if (localStorage.getItem('accessToken')) return

    const self = `${window.location.pathname}${window.location.search}`
    router.replace(`/login?redirect=${encodeURIComponent(self)}`)
  }, [isAuthenticated, router])

  const describeError = useCallback((error: unknown): { phase: Phase; reason: string } => {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      return { phase: 'invalid', reason: 'This request is not valid. Run `goalslot login` again.' }
    }
    if (status === 410) {
      return { phase: 'invalid', reason: 'This request expired. Run `goalslot login` again.' }
    }
    if (status === 409) {
      return { phase: 'invalid', reason: 'This request was already handled. Run `goalslot login` again.' }
    }
    if (status === 400 || status === 429) {
      return {
        phase: 'invalid',
        reason: 'Too many incorrect codes. Please wait 15 minutes and try again.',
      }
    }
    return { phase: 'invalid', reason: 'Something went wrong. Run `goalslot login` again.' }
  }, [])

  const loadByCode = useCallback(
    async (rawCode: string) => {
      setIsSubmitting(true)
      try {
        const { data } = await cliAuthApi.lookupDeviceCode(rawCode.trim())
        setSession(data)
        setApproveUnlockedAt(Date.now() + DEVICE_APPROVE_DELAY_MS)
        setPhase('review')
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status
        // A wrong code is a typo, not a dead end - keep the user on the entry
        // field instead of sending them back to the terminal.
        if (status === 404) {
          toast.error('That code is not valid')
          setPhase('code-entry')
        } else {
          const described = describeError(error)
          setInvalidReason(described.reason)
          setPhase(described.phase)
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [describeError],
  )

  useEffect(() => {
    if (!isAuthenticated) return
    if (lookupStarted.current) return
    lookupStarted.current = true

    if (sessionParam) {
      void (async () => {
        try {
          const { data } = await cliAuthApi.getSession(sessionParam)
          setSession(data)
          // Loopback needs no delay: the session was created by a process on
          // this same machine, so there is no lure-link vector to slow down.
          setApproveUnlockedAt(0)
          setPhase('review')
        } catch (error) {
          const described = describeError(error)
          setInvalidReason(described.reason)
          setPhase(described.phase)
        }
      })()
      return
    }

    if (userCodeParam) {
      void loadByCode(userCodeParam)
      return
    }

    setPhase('code-entry')
  }, [isAuthenticated, sessionParam, userCodeParam, describeError, loadByCode])

  const msRemaining = session ? new Date(session.expiresAt).getTime() - now : 0
  const hasExpired = Boolean(session) && msRemaining <= 0

  const approveLocked = useMemo(() => {
    if (approveUnlockedAt === null) return true
    return now < approveUnlockedAt
  }, [approveUnlockedAt, now])

  const handleApprove = async () => {
    if (!session) return
    setIsSubmitting(true)
    try {
      const { data } = await cliAuthApi.approve(session.sessionId)
      setPhase('approved')

      if (data.redirectUri) {
        setFallback(data)
        // Client-side navigation to a string the API composed from the redirect
        // URI it validated at session creation. This page never builds that URL
        // itself, and the API never issues a 3xx.
        window.location.assign(data.redirectUri)
      }
    } catch (error) {
      const described = describeError(error)
      setInvalidReason(described.reason)
      setPhase(described.phase)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeny = async () => {
    if (!session) return
    setIsSubmitting(true)
    try {
      await cliAuthApi.deny(session.sessionId)
      setPhase('denied')
    } catch (error) {
      const described = describeError(error)
      setInvalidReason(described.reason)
      setPhase(described.phase)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyCode = async () => {
    if (!fallback?.authorizationCode) return
    try {
      await navigator.clipboard.writeText(fallback.authorizationCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the code and copy it manually.')
    }
  }

  const [showFallback, setShowFallback] = useState(false)
  useEffect(() => {
    if (phase !== 'approved' || !fallback?.redirectUri) return
    const timer = setTimeout(() => setShowFallback(true), REDIRECT_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [phase, fallback])

  if (!isAuthenticated) {
    return <Centered>Redirecting you to sign in…</Centered>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 flex justify-center">
          <GoalSlotBrand size="lg" tagline="Your growth, measured." />
        </Link>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {phase === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-10 text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking this request…
            </div>
          )}

          {phase === 'code-entry' && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (codeInput.trim()) void loadByCode(codeInput)
              }}
            >
              <h1 className="mb-2 text-2xl font-bold uppercase">Authorize GoalSlot CLI</h1>
              <p className="mb-6 text-sm text-zinc-500">Enter the code shown in your terminal.</p>
              <Input
                autoFocus
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                placeholder="BXKQ-7TDM"
                aria-label="Device code"
                className="text-center font-mono text-lg tracking-[0.3em]"
                maxLength={12}
              />
              <Button type="submit" className="mt-4 w-full" disabled={isSubmitting || !codeInput.trim()}>
                {isSubmitting ? 'Checking…' : 'Continue'}
              </Button>
            </form>
          )}

          {phase === 'review' && session && (
            <>
              <h1 className="mb-1 text-2xl font-bold uppercase">Authorize GoalSlot CLI</h1>
              <p className="mb-6 text-sm text-zinc-500">
                Signing in as <span className="font-medium text-zinc-700">{user?.email}</span>
              </p>

              <dl className="mb-5 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
                <Row
                  icon={<Terminal className="h-4 w-4 text-zinc-400" />}
                  label="Client"
                  value={`${session.clientName} v${session.clientVersion}`}
                />
                <Row
                  icon={<Monitor className="h-4 w-4 text-zinc-400" />}
                  label="Device"
                  value={`${session.deviceLabel} (${session.platform})`}
                />
                <Row label="Requested from" value={session.requestIp ?? 'unknown'} mono />
                <Row label="Requested" value={relativeFromNow(session.requestedAt)} />
                <Row label="Expires in" value={formatCountdown(msRemaining)} mono emphasis={msRemaining < 60_000} />
                <Row label="Access" value="Full access to your GoalSlot account" />
              </dl>

              <p className="mb-4 text-xs text-zinc-500">
                Full access covers your goals, tasks, time entries, notes and schedule.
              </p>

              <div className="mb-5 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Only approve this if you just ran <code className="font-mono">goalslot login</code> on{' '}
                  <span className="font-medium">{session.deviceLabel}</span>. Approving gives this CLI the same access
                  you have.
                </span>
              </div>

              {hasExpired ? (
                <p className="text-sm text-zinc-500">
                  This request expired. Run <code className="font-mono">goalslot login</code> again.
                </p>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={handleApprove} disabled={isSubmitting || approveLocked} className="flex-1">
                    {approveLocked ? `Approve (${Math.ceil(((approveUnlockedAt ?? 0) - now) / 1000)})` : 'Approve'}
                  </Button>
                  <Button variant="ghost" onClick={handleDeny} disabled={isSubmitting} className="flex-1">
                    Deny
                  </Button>
                </div>
              )}
            </>
          )}

          {phase === 'approved' && (
            <div className="py-4 text-center">
              <Check className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
              <h1 className="mb-2 text-xl font-bold uppercase">Approved</h1>
              <p className="text-sm text-zinc-500">Return to your terminal.</p>

              {showFallback && fallback?.authorizationCode && (
                <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left">
                  <p className="mb-2 text-sm text-zinc-600">Not redirected? Paste this code into your terminal.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto whitespace-nowrap rounded border border-zinc-200 bg-white px-3 py-2 font-mono text-xs">
                      {fallback.authorizationCode}
                    </code>
                    <Button variant="ghost" size="sm" onClick={copyCode} aria-label="Copy code">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === 'denied' && (
            <div className="py-4 text-center">
              <X className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
              <h1 className="mb-2 text-xl font-bold uppercase">Request denied</h1>
              <p className="text-sm text-zinc-500">Nothing was shared.</p>
            </div>
          )}

          {phase === 'invalid' && (
            <div className="py-4 text-center">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
              <h1 className="mb-2 text-xl font-bold uppercase">No longer valid</h1>
              <p className="text-sm text-zinc-500">{invalidReason}</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Manage CLI tokens in{' '}
          <Link href="/dashboard/settings?tab=cli" className="underline">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

function Row({
  icon,
  label,
  value,
  mono,
  emphasis,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  mono?: boolean
  emphasis?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex items-center gap-2 text-zinc-500">
        {icon}
        {label}
      </dt>
      <dd
        className={[
          'text-right',
          mono ? 'font-mono text-xs' : '',
          emphasis ? 'font-semibold text-amber-700' : 'text-zinc-800',
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center text-zinc-500">{children}</div>
}

export default function CliAuthorizePage() {
  // useSearchParams needs a Suspense boundary or the Next 16 production
  // prerender of this route fails. Same pattern as /auth/callback.
  return (
    <Suspense fallback={<Centered>Loading…</Centered>}>
      <CliAuthorizeInner />
    </Suspense>
  )
}
