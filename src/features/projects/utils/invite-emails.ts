/** POST /projects/:id/invites accepts 1 to 20 emails per call. */
export const MAX_INVITE_EMAILS = 20

// Deliberately loose: one @, something on each side, a dot in the domain, no
// spaces. The server and the email itself are the real check.
const EMAIL_PATTERN = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

/**
 * Splits pasted or typed text into candidate addresses. Handles commas,
 * semicolons, spaces and newlines, and the `Name <a@b.com>` form mail clients
 * put on the clipboard.
 */
export function splitEmailInput(raw: string): string[] {
  return raw
    .replace(/[^<>]*<([^<>]+)>/g, ' $1 ')
    .split(/[\s,;]+/)
    .map((part) => part.trim().replace(/^mailto:/i, '').toLowerCase())
    .filter(Boolean)
}

export interface AddEmailsResult {
  /** The chips after adding: existing first, new valid ones appended, no duplicates. */
  emails: string[]
  /** Tokens that are not email addresses, to keep in the input and explain. */
  invalid: string[]
  /** Valid addresses dropped because the list hit MAX_INVITE_EMAILS. */
  overflow: string[]
}

export function addEmails(existing: string[], raw: string): AddEmailsResult {
  const emails = [...existing]
  const seen = new Set(existing.map((e) => e.toLowerCase()))
  const invalid: string[] = []
  const overflow: string[] = []

  for (const token of splitEmailInput(raw)) {
    if (!isValidEmail(token)) {
      invalid.push(token)
      continue
    }
    if (seen.has(token)) continue
    if (emails.length >= MAX_INVITE_EMAILS) {
      overflow.push(token)
      continue
    }
    seen.add(token)
    emails.push(token)
  }

  return { emails, invalid, overflow }
}

export function inviteButtonLabel(count: number): string {
  if (count <= 0) return 'Send invites'
  return count === 1 ? 'Send 1 invite' : `Send ${count} invites`
}
