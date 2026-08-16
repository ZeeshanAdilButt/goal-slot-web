import { api } from '@/lib/api'
import { registerOperation } from '@/lib/offline/registry'

import { scheduleQueries } from './queries'

const config = (idempotencyKey: string) => ({ headers: { 'Idempotency-Key': idempotencyKey } })

// Creating a block across multiple selected days (schedule-block-modal.tsx)
// sends one request per day, but the whole batch only ever gets ONE
// idempotency key from useOfflineMutation (minted once per mutate() call).
// Posting every day's request with that same key made the server's
// IdempotencyInterceptor see N requests reusing one key with N different
// bodies: whichever landed second, by the time its own key lookup ran,
// either raced the first into a duplicate-looking window or (once the
// first request's record had already been stored) got hard-rejected with
// "idempotency_key_reuse_with_different_payload" — so multi-day creates
// past the first day could silently fail depending on timing. Deriving a
// distinct, deterministic key per day (stable across an outbox replay,
// since it's derived from the same base key + that day's index) gives each
// day's create its own idempotency slot instead of N requests fighting over
// one.
registerOperation<Record<string, unknown>[], unknown>('schedule.createMany', {
  execute: (payloads, key) =>
    Promise.all(
      payloads.map((payload, index) => api.post('/schedule', payload, config(`${key}:${index}`)).then((r) => r.data)),
    ),
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
