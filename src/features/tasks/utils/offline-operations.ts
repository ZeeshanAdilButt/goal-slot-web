import { api } from '@/lib/api'
import { registerOperation } from '@/lib/offline/registry'

import { taskQueries } from './queries'

const config = (idempotencyKey: string) => ({ headers: { 'Idempotency-Key': idempotencyKey } })

export interface TaskCreatePayload {
  id: string
  title?: string
  description?: string
  category?: string
  estimatedMinutes?: number
  goalId?: string
  scheduleBlockId?: string
  dueDate?: string
  notes?: string
}

interface TaskUpdatePayload {
  id: string
  data: Record<string, unknown>
}

interface TaskCompletePayload {
  id: string
  data: { actualMinutes: number; notes?: string }
}

registerOperation<TaskCreatePayload, unknown>('task.create', {
  execute: (payload, key) => api.post('/tasks', payload, config(key)).then((r) => r.data),
  invalidateKeys: [taskQueries.all],
})

registerOperation<TaskUpdatePayload, unknown>('task.update', {
  execute: (payload, key) => api.put(`/tasks/${payload.id}`, payload.data, config(key)).then((r) => r.data),
  invalidateKeys: [taskQueries.all],
})

registerOperation<{ id: string }, unknown>('task.delete', {
  execute: (payload, key) => api.delete(`/tasks/${payload.id}`, config(key)).then((r) => r.data),
  invalidateKeys: [taskQueries.all],
})

registerOperation<TaskCompletePayload, unknown>('task.complete', {
  execute: (payload, key) => api.post(`/tasks/${payload.id}/complete`, payload.data, config(key)).then((r) => r.data),
  invalidateKeys: [taskQueries.all, ['time-tracker'], ['goals']],
})
