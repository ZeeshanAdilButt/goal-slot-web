import assert from 'node:assert/strict'

import { test } from 'vitest'

import { isRememberablePath } from './last-dashboard-path.ts'

test('accepts dashboard pages with query and hash', () => {
  assert.equal(isRememberablePath('/dashboard'), true)
  assert.equal(isRememberablePath('/dashboard/schedule'), true)
  assert.equal(isRememberablePath('/dashboard/tasks?project=abc#top'), true)
  assert.equal(isRememberablePath('/dashboard?tab=1'), true)
})

test('rejects anything that is not a dashboard page', () => {
  assert.equal(isRememberablePath('/'), false)
  assert.equal(isRememberablePath('/login'), false)
  assert.equal(isRememberablePath('/dashboardx'), false)
  assert.equal(isRememberablePath('/app'), false)
  assert.equal(isRememberablePath(null), false)
  assert.equal(isRememberablePath(undefined), false)
})

test('rejects other origins and oversized values', () => {
  assert.equal(isRememberablePath('//evil.example.com/dashboard'), false)
  assert.equal(isRememberablePath('https://evil.example.com/dashboard'), false)
  assert.equal(isRememberablePath('/dashboard/' + 'a'.repeat(500)), false)
})
