'use client'

import { onlineManager, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { genId } from '@/lib/offline/id'
import { addToOutbox } from '@/lib/offline/outbox'
import { getOperation } from '@/lib/offline/registry'
import { refreshPendingCount } from '@/lib/offline/sync'
import type { OfflineMeta } from '@/lib/offline/types'

const QUEUED = Symbol('offline-queued')

interface QueuedResult {
  [QUEUED]: true
}

function isQueued(result: unknown): result is QueuedResult {
  return Boolean(result) && (result as QueuedResult)[QUEUED] === true
}

function hasResponse(err: unknown): boolean {
  return Boolean((err as { response?: unknown })?.response)
}

export interface OfflineMutationConfig<TVars, TContext, TResult = unknown> {
  kind: string
  buildPayload: (vars: TVars, meta: OfflineMeta) => unknown
  optimisticUpdate?: (vars: TVars, meta: OfflineMeta, payload: unknown) => TContext
  getQueuedResult?: (vars: TVars, meta: OfflineMeta, payload: unknown) => TResult
  rollback?: (context: TContext | undefined) => void
  invalidateKeys?: QueryKey[]
  messages?: { offline?: string; success?: string; error?: string }
}

interface InternalVars<TVars> {
  vars: TVars
  meta: OfflineMeta
  payload: unknown
}

export function useOfflineMutation<TVars, TContext = unknown, TResult = unknown>(
  config: OfflineMutationConfig<TVars, TContext, TResult>,
) {
  const queryClient = useQueryClient()

  const enqueue = async (vars: TVars, payload: unknown, meta: OfflineMeta) => {
    await addToOutbox({
      id: genId(),
      kind: config.kind,
      payload,
      idempotencyKey: meta.idempotencyKey,
      createdAt: Date.now(),
      retries: 0,
    })
    await refreshPendingCount()
    const base = typeof payload === 'object' && payload !== null ? payload : {}
    const queuedResult = config.getQueuedResult?.(vars, meta, payload) ?? base
    return { [QUEUED]: true, ...(queuedResult as object) } as TResult & QueuedResult
  }

  const mutation = useMutation<TResult | (TResult & QueuedResult), unknown, InternalVars<TVars>, TContext>({
    // 'always' so our own offline handling runs immediately instead of React
    // Query pausing the mutation (and the UI) until the network returns.
    networkMode: 'always',
    mutationFn: async ({ vars, meta, payload }) => {
      const operation = getOperation(config.kind)
      if (!operation) throw new Error(`No offline operation registered for "${config.kind}"`)

      if (!onlineManager.isOnline()) {
        return enqueue(vars, payload, meta)
      }

      try {
        return (await operation.execute(payload, meta.idempotencyKey)) as TResult
      } catch (err) {
        if (!hasResponse(err)) return enqueue(vars, payload, meta)
        throw err
      }
    },
    onMutate: async ({ vars, meta, payload }) => {
      const ctx = config.optimisticUpdate?.(vars, meta, payload)
      return (ctx ?? {}) as TContext
    },
    onSuccess: (result) => {
      config.invalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
      if (isQueued(result)) {
        if (config.messages?.offline) toast.success(config.messages.offline)
      } else if (config.messages?.success) {
        toast.success(config.messages.success)
      }
    },
    onError: (_err, _vars, context) => {
      config.rollback?.(context)
      toast.error(config.messages?.error ?? 'Something went wrong')
    },
  })

  const buildInternal = (vars: TVars): InternalVars<TVars> => {
    const meta = { entityId: genId(), idempotencyKey: genId() }
    return { vars, meta, payload: config.buildPayload(vars, meta) }
  }

  return {
    ...mutation,
    mutate: (vars: TVars, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate(buildInternal(vars), options),
    mutateAsync: (vars: TVars, options?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync(buildInternal(vars), options),
  }
}
