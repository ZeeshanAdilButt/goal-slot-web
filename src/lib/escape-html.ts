/**
 * Escapes a value for safe insertion into HTML text/content.
 * Use when building HTML strings (e.g. document.write, innerHTML) to prevent XSS.
 */
export function escapeHtml(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
