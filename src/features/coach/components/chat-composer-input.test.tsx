import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ChatComposerInput, isSubmitKey } from './chat-composer-input'

describe('ChatComposerInput', () => {
  it('is a textarea, so pasted newlines survive', () => {
    const html = renderToStaticMarkup(<ChatComposerInput value={'- one\n- two'} onChange={() => undefined} />)
    expect(html).toMatch(/^<textarea/)
    expect(html).toContain('rows="1"')
    expect(html).toContain('- one\n- two')
  })

  it('sends on Enter, adds a line on Shift+Enter, and leaves IME composition alone', () => {
    expect(isSubmitKey({ key: 'Enter', shiftKey: false })).toBe(true)
    expect(isSubmitKey({ key: 'Enter', shiftKey: true })).toBe(false)
    expect(isSubmitKey({ key: 'Enter', shiftKey: false, isComposing: true })).toBe(false)
    expect(isSubmitKey({ key: 'Enter', shiftKey: false, keyCode: 229 })).toBe(false)
    expect(isSubmitKey({ key: 'a', shiftKey: false })).toBe(false)
  })
})
