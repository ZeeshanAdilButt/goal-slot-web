import assert from 'node:assert/strict'

import { beforeEach, test } from 'vitest'

class FakeSessionStorage {
  store = new Map<string, string>()
  /** Bytes this fake will accept before throwing, mirroring the ~5 MB origin budget. */
  quota = Infinity
  setCalls = 0

  getItem(key: string) {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.setCalls += 1
    if (value.length > this.quota) {
      const err = new Error('QuotaExceededError')
      err.name = 'QuotaExceededError'
      throw err
    }
    this.store.set(key, value)
  }

  removeItem(key: string) {
    this.store.delete(key)
  }
}

const storage = new FakeSessionStorage()
const g = globalThis as unknown as Record<string, unknown>
g.window = g.window ?? {}
g.sessionStorage = storage

const { saveWhiteboardDraft, loadWhiteboardDraft, resolveWhiteboardScene, __resetWhiteboardDraftQuotaState } =
  await import('./whiteboard-draft.ts')

const scene = (n: number) => ({
  elements: Array.from({ length: n }, (_, i) => ({ id: `e${i}` })),
  appState: {},
  files: {},
})

beforeEach(() => {
  storage.store.clear()
  storage.quota = Infinity
  storage.setCalls = 0
  __resetWhiteboardDraftQuotaState()
})

test('a draft round-trips', () => {
  saveWhiteboardDraft('wb1', scene(2))
  assert.equal(loadWhiteboardDraft('wb1')?.elements.length, 2)
})

test('a quota failure stops retrying the doomed write for that board', () => {
  // A board carrying a pasted screenshot can be megabytes on its own, and
  // setItem is a synchronous main-thread write. Before this fix the throw was
  // swallowed by a bare catch and every subsequent change retried it.
  storage.quota = 10
  saveWhiteboardDraft('big', scene(50))
  assert.equal(storage.setCalls, 1)

  saveWhiteboardDraft('big', scene(51))
  saveWhiteboardDraft('big', scene(52))
  assert.equal(storage.setCalls, 1, 'must not re-attempt a write already known to blow the quota')
})

test('a quota failure leaves no stale draft behind', () => {
  saveWhiteboardDraft('wb1', scene(2))
  assert.notEqual(loadWhiteboardDraft('wb1'), null)

  storage.quota = 10
  saveWhiteboardDraft('wb1', scene(50))
  assert.equal(loadWhiteboardDraft('wb1'), null, 'an older draft must not survive as the recovery source')
})

test('one board blowing the quota does not disable drafts for another', () => {
  storage.quota = 10
  saveWhiteboardDraft('big', scene(50))

  storage.quota = Infinity
  saveWhiteboardDraft('small', scene(1))
  assert.notEqual(loadWhiteboardDraft('small'), null)
})

test('resolveWhiteboardScene falls back to the draft when content is undefined', () => {
  // A list row carries no `content` at all, so it arrives as `undefined`.
  // A strict `!== null` check would return that straight through and silently
  // skip draft recovery.
  saveWhiteboardDraft('wb1', scene(3))
  assert.equal(resolveWhiteboardScene('wb1', undefined)?.elements.length, 3)
})

test('resolveWhiteboardScene falls back to the draft when content is null', () => {
  saveWhiteboardDraft('wb1', scene(3))
  assert.equal(resolveWhiteboardScene('wb1', null)?.elements.length, 3)
})

test('resolveWhiteboardScene prefers server content over the draft', () => {
  saveWhiteboardDraft('wb1', scene(3))
  assert.equal(resolveWhiteboardScene('wb1', scene(9))?.elements.length, 9)
})
