import assert from 'node:assert/strict'
import { test } from 'node:test'

import { sortPeople, withPeople } from './people.ts'

test('withPeople keeps a name a later sighting has lost', () => {
  const known = withPeople({}, [{ id: 'u1', name: 'Priya Raman', email: 'priya@example.com' }])

  // The share row was revoked and all we have left is the bare id.
  const after = withPeople(known, [{ id: 'u1' }])

  assert.equal(after.u1.name, 'Priya Raman')
  assert.equal(after.u1.email, 'priya@example.com')
})

test('withPeople fills in fields it did not have before', () => {
  const known = withPeople({}, [{ id: 'u1', email: 'priya@example.com' }])
  const after = withPeople(known, [{ id: 'u1', name: 'Priya Raman', avatar: 'https://cdn/a.png' }])

  assert.deepEqual(after.u1, {
    id: 'u1',
    name: 'Priya Raman',
    email: 'priya@example.com',
    avatar: 'https://cdn/a.png',
  })
})

test('withPeople returns the same reference when nothing changed', () => {
  const known = withPeople({}, [{ id: 'u1', name: 'Priya Raman' }])

  assert.equal(withPeople(known, [{ id: 'u1', name: 'Priya Raman' }]), known)
  assert.equal(withPeople(known, [{ id: 'u1', name: '  ' }]), known)
  assert.equal(withPeople(known, [undefined]), known)
  assert.equal(withPeople(known, []), known)
})

test('withPeople ignores entries with no id', () => {
  const known = withPeople({}, [{ id: '', name: 'Nobody' }, undefined])
  assert.deepEqual(known, {})
})

test('withPeople treats blank strings as absent', () => {
  const known = withPeople({}, [{ id: 'u1', name: '   ', email: 'priya@example.com' }])
  assert.equal(known.u1.name, undefined)
  assert.equal(known.u1.email, 'priya@example.com')
})

test('withPeople deduplicates repeated ids across both sharing directions', () => {
  const known = withPeople({}, [
    { id: 'u1', email: 'priya@example.com' },
    { id: 'u1', name: 'Priya Raman' },
    { id: 'u2', name: 'Sam Ali' },
  ])

  assert.deepEqual(Object.keys(known), ['u1', 'u2'])
  assert.equal(known.u1.name, 'Priya Raman')
  assert.equal(known.u1.email, 'priya@example.com')
})

test('sortPeople orders by the label the UI shows, falling back to email', () => {
  const sorted = sortPeople([
    { id: 'u3', email: 'zoe@example.com' },
    { id: 'u1', name: 'Priya Raman' },
    { id: 'u2', name: 'Amir Khan', email: 'amir@example.com' },
  ])

  assert.deepEqual(
    sorted.map((person) => person.id),
    ['u2', 'u1', 'u3'],
  )
})
