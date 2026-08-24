import { api } from '@/lib/api'
import { registerOperation } from '@/lib/offline/registry'

import { goalQueries } from './queries'

const config = (idempotencyKey: string) => ({ headers: { 'Idempotency-Key': idempotencyKey } })

registerOperation<Record<string, unknown>, unknown>('goal.create', {
  execute: (payload, key) => api.post('/goals', payload, config(key)).then((r) => r.data),
  invalidateKeys: [goalQueries.all],
})

registerOperation<{ id: string; data: Record<string, unknown> }, unknown>('goal.update', {
  execute: (payload, key) => api.put(`/goals/${payload.id}`, payload.data, config(key)).then((r) => r.data),
  invalidateKeys: [goalQueries.all],
})

registerOperation<{ id: string }, unknown>('goal.delete', {
  execute: (payload, key) => api.delete(`/goals/${payload.id}`, config(key)).then((r) => r.data),
  invalidateKeys: [goalQueries.all],
})
