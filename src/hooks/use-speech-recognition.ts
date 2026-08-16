'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Minimal Web Speech API typings
//
// lib.dom.d.ts only grew `SpeechRecognition` recently and never carries the
// vendor-prefixed `webkitSpeechRecognition` constructor, so declare just the
// slice we touch instead of pulling a @types package in for one browser API.
// ---------------------------------------------------------------------------

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly length: number
  readonly [index: number]: SpeechRecognitionAlternativeLike
}

interface SpeechRecognitionResultListLike {
  readonly length: number
  readonly [index: number]: SpeechRecognitionResultLike
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultListLike
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string
  readonly message?: string
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

/**
 * `unsupported` is terminal and means the UI should render nothing at all —
 * a mic button that can never work is worse than no mic button.
 *
 * `permission-denied` is sticky for the life of the page: once the browser
 * has said no we never call `start()` again on our own, because Chrome
 * answers a blocked mic instantly with another `not-allowed` and a naive
 * retry turns into a spin loop. The user has to ask for it explicitly
 * (`retryAfterPermissionDenied`) or fix the site permission, which fires
 * the PermissionStatus `change` handler below and clears the latch for us.
 */
export type VoiceStatus =
  | 'unsupported'
  | 'idle'
  | 'listening'
  | 'processing'
  | 'success'
  | 'error'
  | 'permission-denied'

export interface UseSpeechRecognitionOptions {
  /**
   * Called once with the final transcript when the user stops speaking.
   * While it runs the status is `processing`; resolving moves to `success`,
   * throwing moves to `error`.
   */
  onTranscript: (transcript: string) => void | Promise<void>
  /** BCP-47 tag. Defaults to the browser UI language, then en-US. */
  lang?: string
  /** Hard cap on a single dictation, ms. Guards against a mic left open. */
  maxDurationMs?: number
  /** How long the `success` state lingers before falling back to idle, ms. */
  successResetMs?: number
  /**
   * How long to keep listening after the user goes quiet before treating it
   * as "done talking," ms. Omitted (the default): `continuous = false`, so
   * the browser's own end-of-speech detection decides — on Chrome that is
   * typically only one to a few seconds, correct for a short command
   * ("start the timer") but a real problem for anything longer, where an
   * ordinary thinking pause gets read as "finished" and cuts the user off
   * mid-thought.
   *
   * Set this to opt into `continuous = true` instead: the browser is told
   * to keep the mic open indefinitely, and this hook does the "has the user
   * gone quiet" judgment itself — a timer reset on every result (interim or
   * final) that calls `stop()`, same shape as `maxDurationMs`'s timeout,
   * only if nothing new comes in before it fires. `maxDurationMs` still
   * applies underneath as the absolute backstop either way.
   */
  silenceTimeoutMs?: number
}

export interface UseSpeechRecognitionResult {
  /** False until the client-side capability check has run. Gate rendering on this. */
  supported: boolean
  status: VoiceStatus
  /** Live, not-yet-final words. Empty unless status is `listening`. */
  interimTranscript: string
  /** The last finalized transcript, kept through processing/success/error. */
  finalTranscript: string
  /** Human-readable, actionable. Non-null for `error` and `permission-denied`. */
  errorMessage: string | null
  start: () => void
  /** Stop capturing and submit whatever was heard. */
  stop: () => void
  /** Stop capturing and throw the transcript away. */
  cancel: () => void
  /** Back to idle from a terminal `error` / `success` state. */
  reset: () => void
  /** Explicit, user-initiated retry after a denial. Never called automatically. */
  retryAfterPermissionDenied: () => void
}

const PERMISSION_DENIED_MESSAGE =
  'GoalSlot cannot hear you because microphone access is blocked for this site. Allow the microphone in your browser address bar (the icon on the left of the URL), then try again. You can always type the same request in the Coach chat instead.'

function messageForErrorCode(code: string): string {
  switch (code) {
    case 'no-speech':
      return 'No speech detected. Press the microphone and start talking straight away, or type your request in the Coach chat.'
    case 'audio-capture':
      return 'No microphone was found. Check that one is plugged in and selected as your input device, then try again.'
    case 'network':
      return 'Your browser could not reach its speech service. Check your connection and try again, or type your request in the Coach chat.'
    case 'language-not-supported':
      return 'Your browser cannot transcribe this language. Try switching your browser language, or type your request in the Coach chat.'
    case 'bad-grammar':
      return 'Your browser rejected the dictation grammar. Try again, or type your request in the Coach chat.'
    default:
      return `Speech recognition stopped unexpectedly (${code}). Try again, or type your request in the Coach chat.`
  }
}

/**
 * Wraps `SpeechRecognition` / `webkitSpeechRecognition` in a small state
 * machine and hands the final transcript to `onTranscript`.
 *
 * Deliberately dumb about GoalSlot: it produces text and nothing else. All
 * the interpretation, the proposal parsing and the applying belong to the
 * Coach pipeline this feeds, so there is exactly one path from a request to
 * a mutation whether the words were typed or spoken.
 */
export function useSpeechRecognition({
  onTranscript,
  lang,
  maxDurationMs = 20_000,
  successResetMs = 2_200,
  silenceTimeoutMs,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<VoiceStatus>('unsupported')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const finalRef = useRef('')
  const cancelledRef = useRef(false)
  const permissionDeniedRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const successTimerRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<number | null>(null)
  // Read inside the recognition callbacks below via a ref, not the closed-
  // over option directly: start() only re-creates its closure when its own
  // deps change, and silenceTimeoutMs isn't one of them (adding it would
  // tear down and restart listening every time a caller passes a fresh
  // inline number - harmless in practice since it's always a constant here,
  // but the ref is one line and removes the assumption entirely).
  const silenceTimeoutMsRef = useRef(silenceTimeoutMs)
  useEffect(() => {
    silenceTimeoutMsRef.current = silenceTimeoutMs
  }, [silenceTimeoutMs])

  // Keep the callback in a ref: the recognition instance is wired once per
  // dictation, and we do not want a re-created parent callback to force a
  // teardown of a live session mid-sentence.
  const onTranscriptRef = useRef(onTranscript)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  // -- capability detection -------------------------------------------------
  // Runs in an effect rather than during render so the server and the first
  // client render agree (both "not supported", so nothing is emitted) and
  // React never reports a hydration mismatch.
  useEffect(() => {
    const ctor = getSpeechRecognitionCtor()
    // Chrome refuses getUserMedia (and therefore dictation) outside a secure
    // context, so a http:// LAN preview should behave like an unsupported
    // browser rather than offering a button that always errors.
    const secure = typeof window !== 'undefined' && window.isSecureContext !== false
    if (!ctor || !secure) {
      setSupported(false)
      setStatus('unsupported')
      return
    }
    setSupported(true)
    setStatus('idle')
  }, [])

  // -- pre-flight permission state -----------------------------------------
  // If the mic is already blocked for this origin, show the blocked state up
  // front instead of letting the first click fire a prompt that can't appear.
  // The `change` listener also un-latches us the moment the user flips the
  // site permission back to allow, without a reload.
  useEffect(() => {
    if (!supported) return
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return

    let cancelled = false
    let statusHandle: PermissionStatus | null = null
    let changeListener: (() => void) | null = null

    const sync = (state: PermissionState) => {
      if (cancelled) return
      if (state === 'denied') {
        permissionDeniedRef.current = true
        setStatus((cur) => (cur === 'listening' ? cur : 'permission-denied'))
        setErrorMessage(PERMISSION_DENIED_MESSAGE)
      } else {
        permissionDeniedRef.current = false
        setStatus((cur) => (cur === 'permission-denied' ? 'idle' : cur))
        setErrorMessage((cur) => (cur === PERMISSION_DENIED_MESSAGE ? null : cur))
      }
    }

    navigator.permissions
      // Not every engine knows the "microphone" descriptor; the reject path
      // below is the normal outcome on Firefox and is not an error worth
      // surfacing — we simply learn nothing and let the click prompt.
      .query({ name: 'microphone' as PermissionName })
      .then((permissionStatus) => {
        if (cancelled) return
        statusHandle = permissionStatus
        sync(permissionStatus.state)
        changeListener = () => sync(permissionStatus.state)
        permissionStatus.addEventListener('change', changeListener)
      })
      .catch(() => {
        /* descriptor unsupported — fall back to prompt-on-click */
      })

    return () => {
      cancelled = true
      if (statusHandle && changeListener) {
        statusHandle.removeEventListener('change', changeListener)
      }
    }
  }, [supported])

  const teardown = useCallback(() => {
    const rec = recognitionRef.current
    if (rec) {
      rec.onstart = null
      rec.onend = null
      rec.onresult = null
      rec.onerror = null
      try {
        rec.abort()
      } catch {
        /* already stopped */
      }
    }
    recognitionRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      clearTimers()
      teardown()
    }
  }, [clearTimers, teardown])

  const submit = useCallback(
    async (transcript: string) => {
      setStatus('processing')
      try {
        await onTranscriptRef.current(transcript)
        setStatus('success')
        successTimerRef.current = window.setTimeout(() => {
          successTimerRef.current = null
          setStatus((cur) => (cur === 'success' ? 'idle' : cur))
          setFinalTranscript('')
        }, successResetMs)
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'the request did not go through'
        // Generic on purpose: `onTranscript` may resolve a request directly
        // (the voice fast path) or hand it off to the Coach — this hook
        // stays dumb about which. Echo the transcript back so a long
        // request is not lost to a transient failure; the user can retype
        // or paste it.
        setErrorMessage(`That didn’t go through because ${detail}. Heard: “${transcript}”.`)
        setStatus('error')
      }
    },
    [successResetMs],
  )

  const start = useCallback(() => {
    if (!supported) return

    // Sticky denial: surface the explanation again but never re-prompt.
    if (permissionDeniedRef.current) {
      setErrorMessage(PERMISSION_DENIED_MESSAGE)
      setStatus('permission-denied')
      return
    }

    if (recognitionRef.current) return

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setSupported(false)
      setStatus('unsupported')
      return
    }

    clearTimers()
    cancelledRef.current = false
    finalRef.current = ''
    setInterimTranscript('')
    setFinalTranscript('')
    setErrorMessage(null)

    let recognition: SpeechRecognitionLike
    try {
      recognition = new Ctor()
    } catch {
      setErrorMessage(
        'This browser could not start its speech engine. Type your request in the Coach chat instead.',
      )
      setStatus('error')
      return
    }

    recognition.lang =
      lang ?? (typeof navigator !== 'undefined' ? navigator.language : undefined) ?? 'en-US'
    // Default: one utterance per press. `continuous` would otherwise keep
    // the mic hot after the user finishes, which is both a privacy smell
    // and a way to accumulate stray room noise into a short command.
    //
    // silenceTimeoutMs opts out of that: continuous = true tells the
    // browser not to apply its own (short, unconfigurable) end-of-speech
    // cutoff, and the manual timer in onresult below takes over deciding
    // when the user has actually gone quiet.
    const usingSilenceTimeout = silenceTimeoutMsRef.current !== undefined
    recognition.continuous = usingSilenceTimeout
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setStatus('listening')
    }

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const alternative = result[0]
        if (!alternative) continue
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${alternative.transcript}`.trim()
        } else {
          interim += alternative.transcript
        }
      }
      setInterimTranscript(interim)
      if (finalRef.current) setFinalTranscript(finalRef.current)

      // Any activity - interim or final - means the user is still talking
      // or just paused to think. Push the "they've gone quiet" deadline out
      // again rather than letting an earlier timer fire mid-sentence.
      const silenceMs = silenceTimeoutMsRef.current
      if (silenceMs !== undefined) {
        if (silenceTimerRef.current !== null) window.clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = window.setTimeout(() => {
          silenceTimerRef.current = null
          // stop(), not abort(): submit whatever was heard through the
          // normal onend -> submit path, same as the maxDurationMs
          // backstop below.
          try {
            recognitionRef.current?.stop()
          } catch {
            /* already stopped */
          }
        }, silenceMs)
      }
    }

    recognition.onerror = (event) => {
      const code = event.error
      // `aborted` is what our own cancel()/abort() raises; it is not a failure.
      if (code === 'aborted') return
      cancelledRef.current = true
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        permissionDeniedRef.current = true
        setErrorMessage(PERMISSION_DENIED_MESSAGE)
        setStatus('permission-denied')
        return
      }
      setErrorMessage(messageForErrorCode(code))
      setStatus('error')
    }

    recognition.onend = () => {
      clearTimers()
      recognitionRef.current = null
      setInterimTranscript('')
      if (cancelledRef.current) return
      const transcript = finalRef.current.trim()
      if (!transcript) {
        // Ending with nothing usually means the user pressed stop before
        // saying anything. Say so rather than silently dropping to idle.
        setErrorMessage(
          'Nothing was picked up. Press the microphone and speak, or type your request in the Coach chat.',
        )
        setStatus('error')
        return
      }
      void submit(transcript)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      // Optimistic: `onstart` can lag behind the permission prompt by a beat
      // and a mic button that looks dead for a second reads as broken.
      setStatus('listening')
    } catch {
      recognitionRef.current = null
      setErrorMessage('Could not start listening. Try again, or type your request in the Coach chat.')
      setStatus('error')
      return
    }

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      // Submit what we have rather than discarding it — the user was probably
      // mid-thought, and stop() still routes through onend.
      try {
        recognitionRef.current?.stop()
      } catch {
        /* already stopped */
      }
    }, maxDurationMs)
  }, [clearTimers, lang, maxDurationMs, submit, supported])

  const stop = useCallback(() => {
    clearTimers()
    try {
      recognitionRef.current?.stop()
    } catch {
      /* already stopped */
    }
  }, [clearTimers])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    clearTimers()
    teardown()
    setInterimTranscript('')
    setFinalTranscript('')
    setErrorMessage(null)
    setStatus((cur) => (cur === 'unsupported' ? cur : 'idle'))
  }, [clearTimers, teardown])

  const reset = useCallback(() => {
    clearTimers()
    setInterimTranscript('')
    setFinalTranscript('')
    setErrorMessage(null)
    setStatus((cur) => (cur === 'unsupported' ? cur : 'idle'))
  }, [clearTimers])

  const retryAfterPermissionDenied = useCallback(() => {
    permissionDeniedRef.current = false
    setErrorMessage(null)
    setStatus('idle')
    // Deliberately does not auto-start. The user presses the mic again, so a
    // second denial costs one click rather than spinning.
  }, [])

  return {
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
  }
}
