import type { QueryKey } from '@tanstack/react-query'

export interface OutboxEntry {
  id: string
  kind: string
  payload: unknown
  idempotencyKey: string
  createdAt: number
  retries: number
}

export interface OfflineOperation<TPayload = unknown, TResult = unknown> {
  execute: (payload: TPayload, idempotencyKey: string) => Promise<TResult>
  invalidateKeys?: QueryKey[]
}

export interface OfflineMeta {
  entityId: string
  idempotencyKey: string
}
