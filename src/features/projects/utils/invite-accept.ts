export type InviteAcceptProblem =
  | { kind: 'wrong-email'; message: string }
  | { kind: 'expired'; message: string }
  | { kind: 'not-found'; message: string }
  | { kind: 'other'; message: string }

const DEFAULT_MESSAGES = {
  'wrong-email':
    'This invite was sent to a different email address. Sign in with that address to accept it, or ask for a new invite.',
  expired: 'This invite has expired or was withdrawn. Ask the person who invited you to send a new one.',
  'not-found': 'We could not find this invite. The link may be incomplete, or it was withdrawn.',
  other: 'Something went wrong. Please try again.',
} as const

/**
 * Maps an invite preview or accept failure to a plain-words state.
 * 403 is the email mismatch, 410 expired or revoked, 404 unknown token.
 */
export function inviteProblemFromError(error: unknown): InviteAcceptProblem {
  const response = (error as { response?: { status?: number; data?: { message?: unknown } } })?.response
  const status = response?.status
  const raw = response?.data?.message
  const serverMessage = typeof raw === 'string' && raw.trim() ? raw.trim() : null

  if (status === 403) return { kind: 'wrong-email', message: serverMessage ?? DEFAULT_MESSAGES['wrong-email'] }
  if (status === 410) return { kind: 'expired', message: DEFAULT_MESSAGES.expired }
  if (status === 404) return { kind: 'not-found', message: DEFAULT_MESSAGES['not-found'] }
  return { kind: 'other', message: serverMessage ?? DEFAULT_MESSAGES.other }
}

/** The accept response is not pinned down beyond "creates membership"; read the project id if present. */
export function projectIdFromAcceptResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as { projectId?: unknown; project?: { id?: unknown } }
  if (typeof d.projectId === 'string' && d.projectId) return d.projectId
  if (typeof d.project?.id === 'string' && d.project.id) return d.project.id
  return null
}
