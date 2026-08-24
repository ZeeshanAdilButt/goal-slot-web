import { get, set } from 'idb-keyval'

import type { OutboxEntry } from './types'

const KEY = 'goalslot-offline-outbox'

// Serialize all read-modify-write cycles through one promise chain so concurrent
// enqueues within a tab can't clobber each other.
let chain: Promise<unknown> = Promise.resolve()

async function readEntries(): Promise<OutboxEntry[]> {
  return (await get<OutboxEntry[]>(KEY)) ?? []
}

function mutate<T>(op: (entries: OutboxEntry[]) => { next: OutboxEntry[]; result: T }): Promise<T> {
  const run = chain.then(async () => {
    const entries = await readEntries()
    const { next, result } = op(entries)
    await set(KEY, next)
    return result
  })
  chain = run.catch(() => undefined)
  return run
}

export function getOutbox(): Promise<OutboxEntry[]> {
  return chain.then(readEntries)
}

export async function getOutboxCount(): Promise<number> {
  return (await getOutbox()).length
}

export function addToOutbox(entry: OutboxEntry): Promise<OutboxEntry> {
  return mutate((entries) => ({ next: [...entries, entry], result: entry }))
}

export function removeFromOutbox(id: string): Promise<void> {
  return mutate((entries) => ({ next: entries.filter((e) => e.id !== id), result: undefined }))
}

export function bumpRetries(id: string): Promise<void> {
  return mutate((entries) => ({
    next: entries.map((e) => (e.id === id ? { ...e, retries: e.retries + 1 } : e)),
    result: undefined,
  }))
}

/**
 * Drops every queued write. Called when the signed-in identity changes:
 * entries are recorded without an owner, so anything still queued from the
 * previous account would replay against the new account's token.
 *
 * Goes through `mutate` rather than deleting the IndexedDB key directly so it
 * joins the same serialization chain as every other write - a concurrent
 * enqueue can't land between the read and the clear and survive it.
 */
export function clearOutbox(): Promise<void> {
  return mutate(() => ({ next: [], result: undefined }))
}
