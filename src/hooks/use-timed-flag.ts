import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_DURATION_MS = 2000

/**
 * Transient state that auto-reverts to `null` after `duration` ms — the
 * "Copied!" indicator pattern used across the editors (copy link, copy as
 * markdown/HTML, etc). Call `flash(value)` to show `value`; any pending
 * revert is cleared first, so re-flashing while already showing restarts
 * the timer instead of letting a stale timeout cut it short.
 */
export function useTimedFlag<T = true>(duration = DEFAULT_DURATION_MS) {
  const [value, setValue] = useState<T | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const flash = useCallback(
    (next: T = true as T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setValue(next)
      timeoutRef.current = setTimeout(() => setValue(null), duration)
    },
    [duration],
  )

  return [value, flash] as const
}
