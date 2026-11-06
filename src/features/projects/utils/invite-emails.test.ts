import { describe, expect, it } from 'vitest'

import { addEmails, inviteButtonLabel, isValidEmail, MAX_INVITE_EMAILS, splitEmailInput } from './invite-emails'

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

  it('labels the send button by count', () => {
    expect(inviteButtonLabel(0)).toBe('Send invites')
    expect(inviteButtonLabel(1)).toBe('Send 1 invite')
    expect(inviteButtonLabel(2)).toBe('Send 2 invites')
  })
})
