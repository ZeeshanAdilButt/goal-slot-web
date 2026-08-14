'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import { AlertTriangle, Check, Loader2, Mic, MicOff, Square, X, Zap } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useDismissable } from '@/lib/use-dismissable'
import { requestCoachSend } from '@/lib/coach-bridge'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { useVoiceFastPath } from '@/hooks/use-voice-fast-path'
import { Button } from '@/components/ui/button'

/**
 * Floating microphone, anchored in the bottom-right cluster next to the
 * Coach button on every authenticated page.
 *
 * Every transcript is first offered to the voice fast path
 * (useVoiceFastPath, backed by the plain REST `/coach/voice-intent` classify
 * call): trivial, reversible commands it's confident about — start/stop/
 * pause/resume the timer, a quick note, a journal line, a bare task — run
 * directly against the same mutations their own pages use, near-instantly
 * and with no confirmation step. Anything the fast path declines (including
 * a classify call that fails or times out — it never blocks on that) is
 * dispatched on the `goalslot:coach-send` bridge exactly as before: the
 * Coach quick-chat popover (or the full Coach page) picks it up and pushes
 * it through the same `coachApi.streamChat` call the typed composer uses,
 * proposal card and Apply button untouched. A spoken request that reaches
 * Coach and a typed one are still the same request by the time anything can
 * change in the database — the fast path only shortens the trivial cases.
 *
 * Renders nothing when the browser has no Web Speech API. A microphone
 * that cannot listen is worse than no microphone at all.
 */
export function FloatingVoiceButton() {
  const pathname = usePathname() ?? ''
  // Same gate as the Coach and Journal buttons. Unlike the Coach button we
  // stay mounted on /dashboard/coach too, because the Coach page's own chat
  // section listens on the bridge there.
  if (!pathname.startsWith('/dashboard')) return null
  return <FloatingVoiceButtonInner />
}

function FloatingVoiceButtonInner() {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const { attempt: attemptFastPath } = useVoiceFastPath()

  // Which path the *current* (or just-finished) transcript took, so the
  // button's processing/success visuals can say "doing it now" vs "sending
  // to the Coach" instead of always assuming the slow path. `null` while a
  // transcript is still being classified, and reset at the start of every
  // new listening session (see handleClick / the "Try again" button below).
  const [routeKind, setRouteKind] = useState<'fast' | 'coach' | null>(null)
  const [actionSummary, setActionSummary] = useState<string | null>(null)

  const handleTranscript = useCallback(
    async (transcript: string) => {
      setRouteKind(null)
      setActionSummary(null)
      const result = await attemptFastPath(transcript)
      if (result.handled) {
        setRouteKind('fast')
        setActionSummary(result.summary)
        return
      }
      setRouteKind('coach')
      const { delivered, reason } = requestCoachSend(transcript)
      if (!delivered) throw new Error(reason ?? 'the Coach chat did not respond')
    },
    [attemptFastPath],
  )

  const {
    supported,
    status,
    interimTranscript,
    finalTranscript,
    errorMessage,
    start,
    stop,
    cancel,
    reset,
    retryAfterPermissionDenied,
  } = useSpeechRecognition({ onTranscript: handleTranscript })

  const listening = status === 'listening'
  const failed = status === 'error' || status === 'permission-denied'
  const panelOpen = listening || failed

  const dismissPanel = useCallback(() => {
    if (listening) cancel()
    else reset()
  }, [cancel, listening, reset])

  // Escape and outside-click close the panel; the trigger is excluded so its
  // own onClick does the toggling instead of racing the dismiss.
  const ignoreRefs = useMemo(() => [buttonRef], [])
  const panelRef = useDismissable<HTMLDivElement>(panelOpen, dismissPanel, ignoreRefs)

  if (!supported) return null

  const handleClick = () => {
    if (status === 'processing') return
    if (listening) {
      stop()
      return
    }
    if (failed) {
      // The failure panel is showing, so the press reads as "dismiss this".
      // Retrying is the explicit button inside the panel. After a denial the
      // hook keeps its latch set even though we are back at idle, so a later
      // press re-explains rather than firing a prompt the browser will not
      // show — which is what stops this becoming a permission loop.
      reset()
      return
    }
    // Fresh session: forget which path the previous transcript took so its
    // "doing it now" / "sent to the Coach" copy doesn't flash stale before
    // this one is classified.
    setRouteKind(null)
    setActionSummary(null)
    start()
  }

  const isFast = routeKind === 'fast'

  const label = (() => {
    switch (status) {
      case 'listening':
        return 'Stop listening and send your request'
      case 'processing':
        return isFast ? 'Doing it now' : routeKind === 'coach' ? 'Sending your request to the Coach' : 'Working out what to do'
      case 'success':
        return isFast ? actionSummary ?? 'Done' : 'Sent to the Coach'
      case 'permission-denied':
        return 'Microphone blocked. Dismiss this message'
      case 'error':
        return 'Voice input failed. Dismiss this message'
      default:
        return 'Speak a request to the Coach'
    }
  })()

  const politeAnnouncement = (() => {
    switch (status) {
      case 'listening':
        return 'Listening. Speak your request, then press the button again to send it.'
      case 'processing':
        return isFast
          ? 'Doing it now.'
          : routeKind === 'coach'
            ? 'Sending your request to the Coach.'
            : 'Working out what to do with that.'
      case 'success':
        return isFast
          ? actionSummary ?? 'Done.'
          : finalTranscript
            ? `Sent to the Coach: ${finalTranscript}. The Coach will reply with a proposed change for you to review and confirm.`
            : 'Sent to the Coach.'
      default:
        return ''
    }
  })()

  return (
    <>
      {/* Interim words are intentionally kept out of the live regions: a
          screen reader re-reading every partial guess is unusable. Only the
          discrete state changes and the final transcript are announced. */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {politeAnnouncement}
      </span>
      <span className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {failed && errorMessage ? errorMessage : ''}
      </span>

      <button
        ref={buttonRef}
        id="floating-voice-trigger"
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        aria-pressed={listening}
        aria-expanded={panelOpen}
        aria-busy={status === 'processing'}
        className={cn(
          'group relative inline-flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-lg transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d] focus-visible:ring-offset-2',
          'hover:-translate-y-0.5',
          status === 'idle' && 'border-zinc-200 text-zinc-700 hover:border-[#f2cc0d] hover:text-[#8a7307]',
          listening && 'border-[#f2cc0d] bg-[#fffbea] text-[#8a7307]',
          // Fast-path actions get their own emerald accent (matches the
          // "shared free trial" accent elsewhere) so a spoken command that
          // ran directly reads as visually distinct from one handed off to
          // the Coach, not just via different copy.
          (status === 'processing' || status === 'success') &&
            (isFast ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-[#f2cc0d] bg-[#fffbea] text-[#8a7307]'),
          failed && 'border-rose-300 bg-rose-50 text-rose-600 hover:border-rose-400',
        )}
      >
        {listening && (
          <>
            {/* Two decorative rings so "we are recording" is legible at a
                glance and not only through colour. Suppressed for users who
                asked for reduced motion. */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-[#f2cc0d]/30 motion-safe:animate-ping"
            />
            <span
              aria-hidden
              className="absolute -inset-1 rounded-full border border-[#f2cc0d]/50 motion-safe:animate-pulse"
            />
          </>
        )}
        <span className="relative inline-flex">
          {status === 'processing' ? (
            isFast ? (
              <Zap className="h-5 w-5 animate-pulse fill-current" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )
          ) : status === 'success' ? (
            isFast ? <Zap className="h-5 w-5 fill-current" /> : <Check className="h-5 w-5" />
          ) : status === 'permission-denied' ? (
            <MicOff className="h-5 w-5" />
          ) : status === 'error' ? (
            <AlertTriangle className="h-5 w-5" />
          ) : listening ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </span>
      </button>

      {panelOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={listening ? 'Voice input' : 'Voice input problem'}
          // Geometry is deliberately identical to the Coach quick-chat
          // popover (floating-coach-popover.tsx: same `bottom-20 right-4`,
          // same `w-[min(380px,...)]`). Dictation usually happens *with* the
          // Coach chat open, since that is where the transcript is going, so
          // the two are on screen together constantly. They used to differ:
          // 340px vs 380px wide, and `sm:right-6` vs `right-4` — so on any
          // screen >= sm this sat 8px off and 40px narrow, half-covering the
          // chat behind it with mismatched edges and reading as a glitch.
          // Matching the geometry makes it land as one aligned sheet.
          //
          // z-[60] rather than z-50: both panels were z-50, so which one won
          // came down to DOM order rather than intent. The listening sheet is
          // transient and modal-ish, so it should always be the one on top.
          className="fixed bottom-20 right-4 z-[60] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        >
          {listening ? (
            <>
              <header className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-gradient-to-br from-[#fffbea] to-white px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative inline-flex h-2 w-2">
                    <span
                      aria-hidden
                      className="absolute inline-flex h-full w-full rounded-full bg-[#f2cc0d] motion-safe:animate-ping"
                    />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f2cc0d]" />
                  </span>
                  <div className="text-sm font-semibold text-zinc-900">Listening…</div>
                </div>
                <button
                  type="button"
                  onClick={cancel}
                  aria-label="Cancel voice input"
                  title="Cancel"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="px-3 py-3">
                <p className="min-h-[2.5rem] text-[13px] leading-relaxed text-zinc-900">
                  {finalTranscript || interimTranscript ? (
                    <>
                      <span>{finalTranscript}</span>
                      {finalTranscript && interimTranscript ? ' ' : ''}
                      <span className="text-zinc-400">{interimTranscript}</span>
                    </>
                  ) : (
                    <span className="text-zinc-400">
                      Try “stop the timer” or “move my study block to 7pm”.
                    </span>
                  )}
                </p>
                <p className="mt-2 text-[11px] text-zinc-500">
                  Quick commands (start, stop, pause, resume, a quick note) run right away.
                  Anything else goes to the Coach for you to confirm.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-white px-3 py-2">
                <Button type="button" variant="secondary" size="sm" onClick={cancel}>
                  Cancel
                </Button>
                <Button type="button" variant="brand" size="sm" onClick={stop}>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Stop &amp; send
                </Button>
              </div>
            </>
          ) : (
            <>
              <header className="flex items-center justify-between gap-2 border-b border-rose-100 bg-rose-50 px-3 py-2.5">
                <div className="flex items-center gap-2 text-rose-700">
                  {status === 'permission-denied' ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <div className="text-sm font-semibold">
                    {status === 'permission-denied' ? 'Microphone blocked' : 'Voice input failed'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Dismiss"
                  title="Dismiss"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="px-3 py-3">
                <p className="text-[13px] leading-relaxed text-zinc-700">{errorMessage}</p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-white px-3 py-2">
                <Button type="button" variant="secondary" size="sm" onClick={reset}>
                  Dismiss
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  onClick={() => {
                    if (status === 'permission-denied') {
                      // Clears the latch only. The user still has to press the
                      // mic, so a still-blocked site costs one click, not a loop.
                      retryAfterPermissionDenied()
                    } else {
                      setRouteKind(null)
                      setActionSummary(null)
                      reset()
                      start()
                    }
                  }}
                >
                  {status === 'permission-denied' ? 'I have allowed it' : 'Try again'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
