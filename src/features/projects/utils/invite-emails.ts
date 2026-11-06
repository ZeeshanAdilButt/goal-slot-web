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
  // Entries are separated by commas, semicolons or newlines. Within one entry
  // an angle-bracket address wins and the display name around it is dropped;
  // otherwise the entry may still hold several space-separated addresses.
  return raw
    .split(/[,;\n\r]+/)
    .flatMap((entry) => {
      const bracketed = entry.match(/<([^<>]+)>/)
      return bracketed ? [bracketed[1]] : entry.split(/\s+/)
    })
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

/**
 * "2 sent, 1 already member, 1 re-sent" from POST /projects/:id/invites.
 * Re-sent = a pending invite whose token and expiry were refreshed and emailed again.
 */
export function summarizeInviteResult(result: {
  invited?: ReadonlyArray<{ email?: string; emailSent?: boolean }>
  skipped?: ReadonlyArray<{ email?: string; reason: string }>
}): string {
  const invited = result.invited ?? []
  const skipped = result.skipped ?? []
  const sent = invited.length
  const members = skipped.filter((s) => s.reason === 'already_member').length
  const resent = skipped.filter((s) => s.reason === 'pending_refreshed').length
  const notEmailed = invited.filter((i) => i.emailSent === false).length

  const parts = [`${sent} sent`]
  if (members) parts.push(`${members} already ${members === 1 ? 'a member' : 'members'}`)
  if (resent) parts.push(`${resent} re-sent`)
  if (notEmailed) parts.push(`${notEmailed} could not be emailed, share the link instead`)
  return parts.join(', ')
}

/** Addresses that were invited but whose email did not go out. */
export function failedInviteEmails(result: {
  invited?: ReadonlyArray<{ email?: string; emailSent?: boolean }>
}): string[] {
  return (result.invited ?? [])
    .filter((i) => i.emailSent === false && !!i.email)
    .map((i) => i.email as string)
}

/** The copy URL for an invite link: origin + the relative path the API returns. */
export function inviteLinkUrl(origin: string, inviteLink: string): string {
  const path = inviteLink.startsWith('/') ? inviteLink : `/${inviteLink}`
  return `${origin.replace(/\/+$/, '')}${path}`
}

export function inviteButtonLabel(count: number): string {
  if (count <= 0) return 'Send invites'
  return count === 1 ? 'Send 1 invite' : `Send ${count} invites`
}
