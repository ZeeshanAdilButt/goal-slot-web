import { describe, expect, it } from 'vitest'

import { inviteProblemFromError, projectIdFromAcceptResponse } from './invite-accept'

const httpError = (status: number, message?: string) => ({ response: { status, data: message ? { message } : {} } })

describe('invite accept states', () => {
  it('403 is the wrong-email state and keeps the server explanation', () => {
    expect(inviteProblemFromError(httpError(403, 'This invite is for h***@devweekends.com'))).toEqual({
      kind: 'wrong-email',
      message: 'This invite is for h***@devweekends.com',
    })
    expect(inviteProblemFromError(httpError(403)).kind).toBe('wrong-email')
  })

  it('410 is expired or revoked', () => {
    expect(inviteProblemFromError(httpError(410, 'Gone')).kind).toBe('expired')
  })

  it('404 is an unknown token', () => {
    expect(inviteProblemFromError(httpError(404)).kind).toBe('not-found')
  })

  it('anything else is a generic retryable problem', () => {
    expect(inviteProblemFromError(new Error('Network Error')).kind).toBe('other')
  })

  it('reads the project id from the accept response when present', () => {
    expect(projectIdFromAcceptResponse({ projectId: 'p1' })).toBe('p1')
    expect(projectIdFromAcceptResponse({ project: { id: 'p2' } })).toBe('p2')
    expect(projectIdFromAcceptResponse({ ok: true })).toBeNull()
    expect(projectIdFromAcceptResponse(null)).toBeNull()
  })
})
