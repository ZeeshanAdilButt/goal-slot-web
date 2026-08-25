import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isSafeInternalPath } from './post-login-redirect.ts'

test('accepts an ordinary same-origin path', () => {
  assert.equal(isSafeInternalPath('/cli/authorize?session=abc'), true)
  assert.equal(isSafeInternalPath('/dashboard'), true)
})

test('rejects a protocol-relative URL', () => {
  // Browsers treat //host as another origin, so this is the case that turns a
  // post-login redirect into an open redirect laundered through our own login
  // page. A naive startsWith('/') check would wave it through.
  assert.equal(isSafeInternalPath('//evil.example.com/steal'), false)
  assert.equal(isSafeInternalPath('///evil.example.com'), false)
})

test('rejects absolute URLs and other schemes', () => {
  assert.equal(isSafeInternalPath('https://evil.example.com'), false)
  assert.equal(isSafeInternalPath('javascript:alert(1)'), false)
  assert.equal(isSafeInternalPath('data:text/html,<script>'), false)
})

test('rejects empty and missing values', () => {
  assert.equal(isSafeInternalPath(''), false)
  assert.equal(isSafeInternalPath(null), false)
  assert.equal(isSafeInternalPath(undefined), false)
})
