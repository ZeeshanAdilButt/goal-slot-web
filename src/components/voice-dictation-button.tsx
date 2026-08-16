'use client'

import { AlertTriangle, Check, Loader2, Mic, MicOff, Square } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'

export interface VoiceDictationButtonProps {
  /** Called with the finalized transcript once the user stops speaking. */
  onTranscript: (transcript: string) => void | Promise<void>
  /** Disables the trigger without hiding it (e.g. while a reply is streaming). */
  disabled?: boolean
  className?: string
  label?: string
  /**
   * Which way the listening/error panel opens relative to the button.
   * Default 'top' fits a button sitting near the bottom of its container
   * (a composer row). Set 'bottom' when the button sits near the TOP of a
   * clipped (`overflow-hidden`) container instead — opening upward there
   * pushes the panel past the container's edge and it renders invisible,
   * clipped away with no visible error (see journal-entry-editor.tsx).
   */
  panelSide?: 'top' | 'bottom'
  /**
   * 'icon' (default): compact, unlabeled - fits inline in a composer row
   * next to a text input, where an icon-only trigger is the expected
   * pattern (Coach quick-chat, Journal quick-jot).
   *
   * 'labeled': visible "Dictate" text and a brand-yellow idle state, sized
   * to stand on its own rather than blend into a row of icons. For a
   * context with no adjacent text field to imply what it does - the full
   * Journal editor's header, where it was reported as easy to miss next to
   * the word count and save-status text. Mirrors mobile's dedicated Voice
   * entry point being an obviously-labeled, first-class control rather
   * than a bare icon.
   */
  variant?: 'icon' | 'labeled'
}

/**
 * Compact mic button meant to sit inline in a composer row (Coach quick
 * chat, Journal quick-jot), as opposed to FloatingVoiceButton which is
 * anchored at a fixed page position.
 *
 * The listening/error panel here is `position: absolute` against this
 * button's own wrapper, not `position: fixed` against the viewport — two
 * fixed-position panels that happen to share coordinates is exactly what
 * let the floating mic silently close the Coach popover it was supposed to
 * feed (both panels rendered at the same fixed spot). Scoping the panel to
 * its trigger avoids that class of bug by construction.
 *
 * Renders nothing when the browser has no Web Speech API — see
 * use-speech-recognition.ts.
 */
export function VoiceDictationButton({
  onTranscript,
  disabled = false,
  className,
  label = 'Speak instead of typing',
  panelSide = 'top',
  variant = 'icon',
}: VoiceDictationButtonProps) {
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
  } = useSpeechRecognition({ onTranscript })

  const listening = status === 'listening'
  const failed = status === 'error' || status === 'permission-denied'
  const panelOpen = listening || failed

  if (!supported) return null

  const handleClick = () => {
    if (disabled || status === 'processing') return
    if (listening) {
      stop()
      return
    }
    if (failed) {
      reset()
      return
    }
    start()
  }

  const title = (() => {
    switch (status) {
      case 'listening':
        return 'Stop listening and use this text'
      case 'processing':
        return 'Processing…'
      case 'success':
        return 'Captured'
      case 'permission-denied':
        return 'Microphone blocked. Dismiss this message'
      case 'error':
        return 'Voice input failed. Dismiss this message'
      default:
        return label
    }
  })()

  // Short enough to sit next to the icon without wrapping the button onto
  // two lines at the width this renders at.
  const visibleLabel = (() => {
    switch (status) {
      case 'listening':
        return 'Listening…'
      case 'processing':
        return 'Processing…'
      case 'success':
        return 'Captured'
      case 'permission-denied':
        return 'Blocked'
      case 'error':
        return 'Failed'
      default:
        return 'Dictate'
    }
  })()

  const labeled = variant === 'labeled'

  return (
    <div className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled && !panelOpen}
        aria-label={title}
        title={title}
        aria-pressed={listening}
        aria-expanded={panelOpen}
        aria-busy={status === 'processing'}
        className={cn(
          'inline-flex items-center justify-center rounded-md border font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f2cc0d]',
          labeled ? 'h-9 gap-1.5 px-3 text-xs' : 'h-9 w-9',
          status === 'idle' &&
            (labeled
              ? 'border-[#f2cc0d]/60 bg-[#fffbea] text-[#8a7307] hover:border-[#f2cc0d] hover:bg-[#fff6cc]'
              : 'border-zinc-200 bg-white text-zinc-500 hover:border-[#f2cc0d] hover:text-[#8a7307]'),
          listening && 'border-[#f2cc0d] bg-[#fffbea] text-[#8a7307]',
          status === 'processing' && 'border-[#f2cc0d] bg-white text-[#8a7307]',
          status === 'success' && 'border-[#f2cc0d] bg-[#fffbea] text-[#8a7307]',
          failed && 'border-rose-300 bg-rose-50 text-rose-600 hover:border-rose-400',
          disabled && !panelOpen && 'cursor-not-allowed opacity-50',
        )}
      >
        {status === 'processing' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'success' ? (
          <Check className="h-4 w-4" />
        ) : status === 'permission-denied' ? (
          <MicOff className="h-4 w-4" />
        ) : status === 'error' ? (
          <AlertTriangle className="h-4 w-4" />
        ) : listening ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {labeled && <span>{visibleLabel}</span>}
      </button>

      {panelOpen && (
        <div
          role="dialog"
          aria-label={listening ? 'Voice input' : 'Voice input problem'}
          className={cn(
            'absolute right-0 z-10 w-[min(300px,80vw)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl',
            panelSide === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          {listening ? (
            <>
              <div className="flex items-center gap-2 border-b border-zinc-200 bg-gradient-to-br from-[#fffbea] to-white px-3 py-2">
                <span className="relative inline-flex h-2 w-2">
                  <span
                    aria-hidden
                    className="absolute inline-flex h-full w-full rounded-full bg-[#f2cc0d] motion-safe:animate-ping"
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f2cc0d]" />
                </span>
                <span className="text-xs font-semibold text-zinc-900">Listening…</span>
              </div>
              <div className="px-3 py-2">
                <p className="min-h-[2rem] text-[12px] leading-relaxed text-zinc-900">
                  {finalTranscript || interimTranscript ? (
                    <>
                      <span>{finalTranscript}</span>
                      {finalTranscript && interimTranscript ? ' ' : ''}
                      <span className="text-zinc-400">{interimTranscript}</span>
                    </>
                  ) : (
                    <span className="text-zinc-400">Start talking…</span>
                  )}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-3 py-2">
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-md px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={stop}
                  className="inline-flex items-center gap-1 rounded-md bg-[#f2cc0d] px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:brightness-95"
                >
                  <Square className="h-3 w-3 fill-current" />
                  Stop
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-3 py-2 text-rose-700">
                {status === 'permission-denied' ? (
                  <MicOff className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                <span className="text-xs font-semibold">
                  {status === 'permission-denied' ? 'Microphone blocked' : 'Voice input failed'}
                </span>
              </div>
              <div className="px-3 py-2">
                <p className="text-[11px] leading-relaxed text-zinc-700">{errorMessage}</p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-3 py-2">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (status === 'permission-denied') {
                      retryAfterPermissionDenied()
                    } else {
                      reset()
                      start()
                    }
                  }}
                  className="rounded-md bg-[#f2cc0d] px-2 py-1 text-[11px] font-semibold text-zinc-900 hover:brightness-95"
                >
                  {status === 'permission-denied' ? 'I have allowed it' : 'Try again'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
