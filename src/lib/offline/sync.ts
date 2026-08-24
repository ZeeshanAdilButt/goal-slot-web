import { onlineManager, type QueryKey } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { queryClient } from '@/lib/query-client'
import { useOfflineQueueStore } from '@/lib/use-offline-queue-store'

import { bumpRetries, getOutbox, getOutboxCount, removeFromOutbox } from './outbox'
import { getOperation } from './registry'

const MAX_RETRIES = 5

let draining = false

function hasResponse(err: unknown): err is { response: { status: number } } {
  return Boolean((err as { response?: unknown })?.response)
}

export async function refreshPendingCount(): Promise<void> {
  useOfflineQueueStore.getState().setPendingCount(await getOutboxCount())
}

export async function drainOutbox(): Promise<void> {
  if (draining || !onlineManager.isOnline()) return
  draining = true

  let synced = 0
  let dropped = 0
  const keysToInvalidate = new Set<QueryKey>()

  try {
    const entries = await getOutbox()
    for (const entry of entries) {
      if (!onlineManager.isOnline()) break

      const operation = getOperation(entry.kind)
      if (!operation) {
        await removeFromOutbox(entry.id)
        continue
      }

      try {
        await operation.execute(entry.payload, entry.idempotencyKey)
        await removeFromOutbox(entry.id)
        synced++
        operation.invalidateKeys?.forEach((key) => keysToInvalidate.add(key))
      } catch (err) {
        if (!hasResponse(err)) break // still offline — keep the entry and stop

        const status = err.response.status
        const isServerError = status >= 500
        if (isServerError && entry.retries + 1 < MAX_RETRIES) {
          await bumpRetries(entry.id)
          break
        }

        await removeFromOutbox(entry.id)
        dropped++
        operation.invalidateKeys?.forEach((key) => keysToInvalidate.add(key))
      }
    }
  } finally {
    draining = false
    await refreshPendingCount()
    keysToInvalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))

    if (synced > 0) {
      toast.success(`Synced ${synced} offline ${synced === 1 ? 'change' : 'changes'}`)
    }
    if (dropped > 0) {
      toast.error(`${dropped} offline ${dropped === 1 ? 'change' : 'changes'} could not be synced`)
    }
  }
}

export function initOfflineSync(): () => void {
  void refreshPendingCount()
  void drainOutbox()
  return onlineManager.subscribe((online) => {
    if (online) void drainOutbox()
  })
}
