import React, { useLayoutEffect } from 'react'

/**
 * The Coach chat composer field. A textarea, not an <input>: an <input>
 * silently drops every newline from pasted text, so a pasted list
 * ("- Keep Reading and Labs...\n- 30-minute lab first...") reached the Coach
 * as one run-on line ("...one more lab.- 30-minute..."), which is how two
 * production requests were stored.
 *
 * Enter still sends, like the old input. Shift+Enter adds a line, and Enter
 * while an IME composition is open (Japanese, Chinese, Korean input) only
 * confirms the composition. The field grows with its content up to a cap.
 */

export function isSubmitKey(e: { key: string; shiftKey: boolean; isComposing?: boolean; keyCode?: number }): boolean {
  // keyCode 229 is what some browsers report for keys pressed during IME composition.
  return e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229
}

const MAX_HEIGHT_PX = 160

type Props = Omit<React.ComponentProps<'textarea'>, 'rows'>

export const ChatComposerInput = React.forwardRef<HTMLTextAreaElement, Props>(function ChatComposerInput(
  { onKeyDown, value, style, ...props },
  ref,
) {
  const local = React.useRef<HTMLTextAreaElement | null>(null)
  const setRefs = (el: HTMLTextAreaElement | null) => {
    local.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  // Grow to fit what was typed or pasted, then scroll past the cap.
  useLayoutEffect(() => {
    const el = local.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [value])

  return (
    <textarea
      {...props}
      ref={setRefs}
      rows={1}
      value={value}
      style={{ resize: 'none', maxHeight: MAX_HEIGHT_PX, ...style }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (isSubmitKey({ key: e.key, shiftKey: e.shiftKey, isComposing: e.nativeEvent.isComposing, keyCode: e.keyCode })) {
          e.preventDefault()
          e.currentTarget.form?.requestSubmit()
        }
      }}
    />
  )
})
