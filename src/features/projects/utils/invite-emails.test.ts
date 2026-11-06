import { describe, expect, it } from 'vitest'

import {
  addEmails,
  failedInviteEmails,
  inviteButtonLabel,
  inviteLinkUrl,
  isValidEmail,
  MAX_INVITE_EMAILS,
  splitEmailInput,
  summarizeInviteResult,
} from './invite-emails'

describe('invite email parsing', () => {
  it('splits on commas, semicolons, spaces and newlines and lowercases', () => {
    expect(splitEmailInput('Hira@DevWeekends.com, usman@devweekends.com;a@b.co\nc@d.io  e@f.org')).toEqual([
      'hira@devweekends.com',
      'usman@devweekends.com',
      'a@b.co',
      'c@d.io',
      'e@f.org',
    ])
  })

  it('reads the "Name <address>" form from mail clients', () => {
    expect(splitEmailInput('Hira Khan <hira@devweekends.com>, "Usman" <usman@x.com>')).toEqual([
      'hira@devweekends.com',
      'usman@x.com',
    ])
  })

  it('keeps a standalone address that comes before a display-name address', () => {
    expect(splitEmailInput('alice@example.com, Bob <bob@example.com>')).toEqual(['alice@example.com', 'bob@example.com'])
    expect(splitEmailInput('Bob <bob@example.com>; carol@example.com dave@example.com')).toEqual([
      'bob@example.com',
      'carol@example.com',
      'dave@example.com',
    ])
  })

  it('lists invited addresses whose email did not go out', () => {
    expect(
      failedInviteEmails({
        invited: [
          { email: 'a@x.com', emailSent: true },
          { email: 'b@x.com', emailSent: false },
        ],
      }),
    ).toEqual(['b@x.com'])
    expect(failedInviteEmails({})).toEqual([])
  })

  it('validates addresses loosely', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('first.last+tag@sub.example.org')).toBe(true)
    expect(isValidEmail('nope')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('a b@c.com')).toBe(false)
    expect(isValidEmail('@c.com')).toBe(false)
  })

  it('adds new chips, skips duplicates case-insensitively, and reports invalid tokens', () => {
    const result = addEmails(['hira@devweekends.com'], 'HIRA@devweekends.com, usman@x.com, not-an-email')
    expect(result.emails).toEqual(['hira@devweekends.com', 'usman@x.com'])
    expect(result.invalid).toEqual(['not-an-email'])
    expect(result.overflow).toEqual([])
  })

  it('caps the list at 20 and reports the overflow', () => {
    const existing = Array.from({ length: MAX_INVITE_EMAILS - 1 }, (_, i) => `u${i}@x.com`)
    const result = addEmails(existing, 'last@x.com, extra1@x.com extra2@x.com')
    expect(result.emails).toHaveLength(MAX_INVITE_EMAILS)
    expect(result.emails.at(-1)).toBe('last@x.com')
    expect(result.overflow).toEqual(['extra1@x.com', 'extra2@x.com'])
  })

  it('empty input changes nothing', () => {
    expect(addEmails(['a@b.co'], '  ,, ')).toEqual({ emails: ['a@b.co'], invalid: [], overflow: [] })
  })

  it('summarizes the send result: sent, already members, re-sent', () => {
    const invited = (n: number, emailSent = true) =>
      Array.from({ length: n }, (_, i) => ({ id: `${i}`, email: `${i}@x.com`, emailSent }))
    expect(
      summarizeInviteResult({
        invited: invited(2),
        skipped: [
          { email: 'a@x.com', reason: 'already_member' },
          { email: 'b@x.com', reason: 'already_member' },
          { email: 'c@x.com', reason: 'pending_refreshed' },
        ],
      }),
    ).toBe('2 sent, 2 already members, 1 re-sent')
    expect(summarizeInviteResult({ invited: invited(1), skipped: [] })).toBe('1 sent')
    expect(summarizeInviteResult({ invited: [], skipped: [{ email: 'a@x.com', reason: 'already_member' }] })).toBe(
      '0 sent, 1 already a member',
    )
    expect(summarizeInviteResult({ invited: invited(1, false), skipped: [] })).toBe(
      '1 sent, 1 could not be emailed, share the link instead',
    )
  })

  it('builds the copy URL from the origin and the relative inviteLink', () => {
    expect(inviteLinkUrl('https://goalslot.io', '/projects/invite?token=abc')).toBe(
      'https://goalslot.io/projects/invite?token=abc',
    )
    expect(inviteLinkUrl('http://localhost:3010/', 'projects/invite?token=abc')).toBe(
      'http://localhost:3010/projects/invite?token=abc',
    )
  })

  it('labels the send button by count', () => {
    expect(inviteButtonLabel(0)).toBe('Send invites')
    expect(inviteButtonLabel(1)).toBe('Send 1 invite')
    expect(inviteButtonLabel(2)).toBe('Send 2 invites')
  })
})
