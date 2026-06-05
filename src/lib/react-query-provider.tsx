'use client'

import { ReactNode, useEffect } from 'react'

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

type ReactQueryProviderProps = {
  children: ReactNode
}

const isDev = process.env.NODE_ENV !== 'production'
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

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
      <QueryClientProvider client={queryClient}>
        <QuerySyncInitializer />
        {children}
        {isDev && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
      </QueryClientProvider>
    </PostHogProvider>
  )
}
