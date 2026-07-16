import { focusQueries } from '@/features/reports/hooks/use-focus-time-entries'
import { goalQueries } from '@/features/goals/utils/queries'
import { taskQueries } from '@/features/tasks/utils/queries'

import { api } from '@/lib/api'
import { registerOperation } from '@/lib/offline/registry'

import { timeTrackerQueries } from './queries'

const config = (idempotencyKey: string) => ({ headers: { 'Idempotency-Key': idempotencyKey } })
const invalidateKeys = [
  timeTrackerQueries.recentEntries(),
  ['time-tracker', 'recent-entries', 'paged'],
  taskQueries.all,
  goalQueries.all,
  ['schedule', 'goals', 'active'],
  focusQueries.all,
]

registerOperation<Record<string, unknown>, unknown>('timeEntry.create', {
  execute: (payload, key) => api.post('/time-entries', payload, config(key)).then((r) => r.data),
  invalidateKeys,
})

registerOperation<{ id: string; data: Record<string, unknown> }, unknown>('timeEntry.update', {
  execute: (payload, key) => api.put(`/time-entries/${payload.id}`, payload.data, config(key)).then((r) => r.data),
  invalidateKeys,
})

registerOperation<{ id: string }, unknown>('timeEntry.delete', {
  execute: (payload, key) => api.delete(`/time-entries/${payload.id}`, config(key)).then((r) => r.data),
  invalidateKeys,
})
