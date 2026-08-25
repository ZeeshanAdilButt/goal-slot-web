import { KnownPeople, withPeople } from '@/features/messaging/utils/people'
import { messagingQueries } from '@/features/messaging/utils/queries'
import { MessagingPerson } from '@/features/messaging/utils/types'
import type { QueryClient } from '@tanstack/react-query'

/**
 * Records names so they survive whatever relationship supplied them.
 *
 * Deliberately stored as a query rather than as its own persisted store:
 * the query cache is already mirrored to IndexedDB and already wiped by
 * `resetClientState()` (`src/lib/store.ts`) the moment the signed-in
 * identity changes, so this inherits both properties instead of adding a
 * fifth per-user store every future reset would have to remember.
 */
export function rememberPeople(queryClient: QueryClient, incoming: Array<MessagingPerson | undefined>): void {
  const queryKey = messagingQueries.knownPeople()
  const existing = queryClient.getQueryData<KnownPeople>(queryKey) ?? {}
  const next = withPeople(existing, incoming)
  if (next !== existing) queryClient.setQueryData<KnownPeople>(queryKey, next)
}
