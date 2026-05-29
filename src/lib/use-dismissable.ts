'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Wires Escape-key and outside-click dismiss for a floating panel. Returns
 * a ref to attach to the panel root; anything outside that ref (and outside
 * any optional `ignoreRefs`) triggers onDismiss on pointerdown. Escape
 * dismisses unconditionally while enabled.
 *
 * pointerdown (capture phase) fires before any outside element's click
 * handler — matches Radix/shadcn popover behaviour and prevents the
 * trigger-button re-toggle bug.
 *
 * `ignoreRefs` is where you'd put the trigger button: clicking it should
 * toggle via its own onClick, not also fire the dismiss handler (which
 * would race the toggle and leave the panel open).
 *
 * `enabled` gates listener attachment so closed panels don't pay for
 * global listeners.
 */
export function useDismissable<T extends HTMLElement>(
  enabled: boolean,
  onDismiss: () => void,
  ignoreRefs: ReadonlyArray<RefObject<HTMLElement | null>> = [],
) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handlePointer = (event: PointerEvent) => {
      const node = ref.current
      if (!node) return
      const target = event.target as Node | null
      if (!target) return
      if (node.contains(target)) return
      for (const ig of ignoreRefs) {
        if (ig.current && ig.current.contains(target)) return
      }
      onDismiss()
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }

    document.addEventListener('pointerdown', handlePointer, true)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [enabled, onDismiss, ignoreRefs])

  return ref
}
