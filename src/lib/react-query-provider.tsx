'use client'

import { ReactNode, useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

import { initOfflineSync } from '@/lib/offline/sync'
import { queryClient } from '@/lib/query-client'
import { PERSIST_MAX_AGE, queryPersister, shouldDehydrateQuery } from '@/lib/query-persister'

import '@/features/goals/utils/offline-operations'
import '@/features/notes/utils/offline-operations'
import '@/features/schedule/utils/offline-operations'
import '@/features/tasks/utils/offline-operations'
import '@/features/time-tracker/utils/offline-operations'

type ReactQueryProviderProps = {
  children: ReactNode
}

const isDev = process.env.NODE_ENV !== 'production'

function OfflineSyncInitializer() {
  useEffect(() => initOfflineSync(), [])
  return null
}

function QuerySyncInitializer() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return

    const channel = new BroadcastChannel('goalslot-sync')

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'COACH_PROPOSAL_APPLIED') {
        // Invalidate all query keys that could be modified by a coach proposal
        queryClient.invalidateQueries({ queryKey: ['goals'] })
        queryClient.invalidateQueries({ queryKey: ['schedule'] })
        queryClient.invalidateQueries({ queryKey: ['schedule-blocks'] })
        queryClient.invalidateQueries({ queryKey: ['scheduleBlocks'] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['time-tracker'] })
        queryClient.invalidateQueries({ queryKey: ['time-entries'] })
        queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
        queryClient.invalidateQueries({ queryKey: ['coach', 'insights'] })
      }
    }

    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [queryClient])

  return null
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <PostHogProvider client={posthog}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: PERSIST_MAX_AGE,
          dehydrateOptions: {
            shouldDehydrateQuery,
          },
        }}
      >
        <OfflineSyncInitializer />
        <QuerySyncInitializer />
        {children}
        {isDev && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
      </PersistQueryClientProvider>
    </PostHogProvider>
  )
}
