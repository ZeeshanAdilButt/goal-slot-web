import { api } from '@/lib/api'
import { registerOperation } from '@/lib/offline/registry'

import { scheduleQueries } from './queries'

const config = (idempotencyKey: string) => ({ headers: { 'Idempotency-Key': idempotencyKey } })

registerOperation<Record<string, unknown>[], unknown>('schedule.createMany', {
  execute: (payloads, key) =>
    Promise.all(payloads.map((payload) => api.post('/schedule', payload, config(key)).then((r) => r.data))),
  invalidateKeys: [scheduleQueries.weeklyKey()],
})

registerOperation<{ id: string; data: Record<string, unknown> }, unknown>('schedule.update', {
  execute: (payload, key) => api.put(`/schedule/${payload.id}`, payload.data, config(key)).then((r) => r.data),
  invalidateKeys: [scheduleQueries.weeklyKey()],
})

registerOperation<{ id: string }, unknown>('schedule.delete', {
  execute: (payload, key) => api.delete(`/schedule/${payload.id}`, config(key)).then((r) => r.data),
  invalidateKeys: [scheduleQueries.weeklyKey()],
})
