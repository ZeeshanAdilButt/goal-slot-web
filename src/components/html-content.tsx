'use client'

import { useMemo } from 'react'

import DOMPurify from 'isomorphic-dompurify'

// Allowlist mirrors what the Tiptap editor can actually produce (see
// tiptap-editor.tsx's extension list) plus the tags the server-side note
// builder emits. Anything outside this is dropped rather than escaped.
//
// isomorphic-dompurify rather than plain dompurify on purpose: two of the
// four call sites (task-header.tsx, compact-task-expanded.tsx) have no
// 'use client' directive of their own, and Next server-renders client
// components on first load anyway -- so this runs in Node with no
// `document`, where browser-only DOMPurify would be a no-op and would ship
// the unsanitised markup straight into the SSR payload.
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
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Belt and braces: ALLOWED_ATTR already excludes event handlers, but
    // this makes an accidental future addition to that list non-fatal.
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    // Blocks javascript:/data: URLs in href and src while keeping the
    // http/https/mailto/tel links and data: images the editor produces.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
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
