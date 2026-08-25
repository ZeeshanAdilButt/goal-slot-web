'use client'

import { useMemo } from 'react'

import sanitizeHtml from 'sanitize-html'

// Allowlist mirrors what the Tiptap editor can actually produce (see
// tiptap-editor.tsx's extension list) plus the tags the server-side note
// builder emits. Anything outside this is dropped rather than escaped.
//
// sanitize-html rather than dompurify because this has to run in Node as
// well as the browser: two of the four call sites (task-header.tsx,
// compact-task-expanded.tsx) have no 'use client' directive of their own,
// and Next server-renders client components on first load anyway, so a
// browser-only sanitiser would no-op and ship the unsanitised markup
// straight into the SSR payload. isomorphic-dompurify covers that by
// pulling in jsdom, which reads its default stylesheet off disk by
// relative path and so breaks Vercel's pnpm prerender with ENOENT on
// browser/default-stylesheet.css. sanitize-html parses with htmlparser2
// and needs no DOM at all.
const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'span',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'code',
  'pre',
  'blockquote',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
]

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'title',
  'width',
  'height',
  'style',
  'class',
  'colspan',
  'rowspan',
  'data-indent',
  'data-type',
  'start',
]

function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    // sanitize-html takes attributes per tag; the previous allowlist was
    // global, so keep it global under the '*' key.
    allowedAttributes: { '*': ALLOWED_ATTR },
    // Anything not listed here is dropped from href/src, which is what
    // kills javascript: and vbscript: URLs.
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    // The editor embeds pasted images as data: URIs, so src alone keeps it.
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    // Drop the contents of these, do not just unwrap the tag, so
    // <script>alert(1)</script> leaves no text behind.
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript'],
    disallowedTagsMode: 'discard',
  })
}

interface HtmlContentProps {
  html: string
  truncate?: number // Number of lines to truncate to (undefined = no truncation)
  className?: string
  as?: 'div' | 'p' | 'span' // HTML element type, defaults to 'div'
}

export function HtmlContent({ html, truncate, className = '', as: Component = 'div' }: HtmlContentProps) {
  const truncateStyles = truncate
    ? {
        display: '-webkit-box',
        WebkitLineClamp: truncate,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }
    : {}

  // Task and goal descriptions are stored as raw Tiptap HTML and were
  // previously handed to dangerouslySetInnerHTML untouched. Today the only
  // way to reach this is with your own description (there is no
  // mentor-write path and no shared payload carries `description`), so it
  // is self-XSS -- but it is a live HTML-injection sink one field away from
  // becoming stored XSS, and web keeps its JWTs in localStorage, so that
  // would be account takeover.
  const clean = useMemo(() => sanitize(html), [html])

  return <Component className={className} style={truncateStyles} dangerouslySetInnerHTML={{ __html: clean }} />
}
