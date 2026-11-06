import { describe, expect, it } from 'vitest'

import { inviteProblemFromError, inviteView, projectIdFromAcceptResponse } from './invite-accept'

const preview = (over: Partial<Parameters<typeof inviteView>[0] & object> = {}) => ({
  projectId: 'p1',
  expired: false,
  revoked: false,
  alreadyMember: false,
  emailMatches: true,
  email: 'hi***@devweekends.com',
  ...over,
})

describe('invite view from the preview', () => {
  it('a matching, live invite is ready to accept', () => {
    expect(inviteView(preview(), null)).toEqual({ kind: 'ready' })
    expect(inviteView(preview({ email: null }), null)).toEqual({ kind: 'ready' })
  })

  it('shows the wrong-email state up front with the masked address', () => {
    expect(inviteView(preview({ emailMatches: false }), null)).toEqual({
      kind: 'wrong-email',
      email: 'hi***@devweekends.com',
      message: null,
    })
  })

  it('already a member links to the project, even if the invite is spent', () => {
    expect(inviteView(preview({ alreadyMember: true, expired: true, emailMatches: false }), null)).toEqual({
      kind: 'already-member',
      projectId: 'p1',
    })
  })

  it('expired and revoked invites are explained, revoked separately', () => {
    expect(inviteView(preview({ expired: true }), null)).toEqual({ kind: 'expired', revoked: false })
    expect(inviteView(preview({ expired: true, revoked: true }), null)).toEqual({ kind: 'expired', revoked: true })
  })

  it('an accept failure wins over the preview', () => {
    expect(inviteView(preview(), { kind: 'wrong-email', message: 'nope' })).toEqual({
      kind: 'wrong-email',
      email: 'hi***@devweekends.com',
      message: 'nope',
    })
    expect(inviteView(preview(), { kind: 'expired', message: 'gone' })).toEqual({ kind: 'expired', revoked: false })
    expect(inviteView(undefined, { kind: 'not-found', message: 'x' })).toEqual({ kind: 'not-found', message: 'x' })
  })
})

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
    expect(projectIdFromAcceptResponse({ projectId: 'p1', role: 'MEMBER', alreadyMember: false })).toBe('p1')
    expect(projectIdFromAcceptResponse({ project: { id: 'p2' } })).toBe('p2')
    expect(projectIdFromAcceptResponse({ ok: true })).toBeNull()
    expect(projectIdFromAcceptResponse(null)).toBeNull()
  })
})
