import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import type { Query } from '@tanstack/react-query'
import { del, get, set } from 'idb-keyval'

// IndexedDB (not localStorage): the dehydrated cache can exceed the ~5MB
// localStorage ceiling, and writes are async so they don't block the main thread.
const CACHE_KEY = 'goalslot-react-query-cache'

export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 7 // 7 days

export const queryPersister = createAsyncStoragePersister({
  key: CACHE_KEY,
  throttleTime: 1000,
  storage: {
    // idb-keyval returns `undefined` for missing keys; the persister expects `string | null`.
    getItem: (key) => get<string>(key).then((value) => value ?? null),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
})

// Coach chat + narrative are large LLM transcripts that are cheap to refetch online.
function isVolatileQuery(query: Query): boolean {
  const key = query.queryKey
  if (!Array.isArray(key)) return false
  return key[0] === 'coach' && (key[1] === 'chat' || key[1] === 'narrative')
}

export function shouldDehydrateQuery(query: Query): boolean {
  return query.state.status === 'success' && !isVolatileQuery(query)
}

// Cleared on login/logout so one user's data can't be restored into another's session.
export async function clearPersistedQueryCache(): Promise<void> {
  try {
    await del(CACHE_KEY)
  } catch {
    // Best-effort: must never block logout.
  }
}
