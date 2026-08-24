import { api } from '@/lib/api'
import { registerOperation } from '@/lib/offline/registry'

const notesKey = ['notes'] as const
const config = (idempotencyKey: string) => ({ headers: { 'Idempotency-Key': idempotencyKey } })

registerOperation<Record<string, unknown>, unknown>('note.create', {
  execute: (payload, key) => api.post('/notes', payload, config(key)).then((r) => r.data),
  invalidateKeys: [notesKey],
})

registerOperation<{ id: string; data: Record<string, unknown> }, unknown>('note.update', {
  execute: (payload, key) => api.put(`/notes/${payload.id}`, payload.data, config(key)).then((r) => r.data),
  invalidateKeys: [notesKey],
})

registerOperation<{ id: string }, unknown>('note.delete', {
  execute: (payload, key) => api.delete(`/notes/${payload.id}`, config(key)).then((r) => r.data),
  invalidateKeys: [notesKey],
})

registerOperation<{ noteId: string; parentId: string | null; order: number }[], unknown>('note.reorder', {
  execute: (payload, key) => api.put('/notes/reorder', payload, config(key)).then((r) => r.data),
  invalidateKeys: [notesKey],
})
