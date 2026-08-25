import assert from 'node:assert/strict'

import { test } from 'vitest'

import { isSafeInternalPath } from './post-login-redirect.ts'

test('accepts an ordinary same-origin path', () => {
  assert.equal(isSafeInternalPath('/cli/authorize?session=abc'), true)
  assert.equal(isSafeInternalPath('/dashboard'), true)
  assert.equal(isSafeInternalPath('/dashboard/settings?tab=cli#top'), true)
})

test('rejects a protocol-relative URL', () => {
  // Browsers treat //host as another origin, so this is the case that turns a
  // post-login redirect into an open redirect laundered through our own login
  // page. A naive startsWith('/') check would wave it through.
  assert.equal(isSafeInternalPath('//evil.example.com/steal'), false)
  assert.equal(isSafeInternalPath('///evil.example.com'), false)
})

test('rejects a backslash standing in for the second slash', () => {
  // The WHATWG URL parser normalises a backslash to a forward slash for
  // http(s), so a browser reads these as //evil.example.com even though a
  // "does it start with //" check says otherwise.
  assert.equal(isSafeInternalPath('/\\evil.example.com'), false)
  assert.equal(isSafeInternalPath('/\\/evil.example.com'), false)
  assert.equal(isSafeInternalPath('/\\\\evil.example.com'), false)
})

test('rejects control characters the URL parser strips', () => {
  // Tab, newline and carriage return are removed anywhere in the input before
  // parsing, so these re-form into a protocol-relative URL after a naive check
  // has already let them past.
  assert.equal(isSafeInternalPath('/\t/evil.example.com'), false)
  assert.equal(isSafeInternalPath('/\n/evil.example.com'), false)
  assert.equal(isSafeInternalPath('/\r/evil.example.com'), false)
})

test('rejects absolute URLs and other schemes', () => {
  assert.equal(isSafeInternalPath('https://evil.example.com'), false)
  assert.equal(isSafeInternalPath('javascript:alert(1)'), false)
  assert.equal(isSafeInternalPath('data:text/html,<script>'), false)
})

test('rejects empty, relative and missing values', () => {
  assert.equal(isSafeInternalPath(''), false)
  assert.equal(isSafeInternalPath('dashboard'), false)
  assert.equal(isSafeInternalPath(null), false)
  assert.equal(isSafeInternalPath(undefined), false)
})
