import { QueryClient } from '@tanstack/react-query'

// Shared instance so non-React code (the auth store) can clear caches too.
// gcTime matches the persisted maxAge (7 days); the default 5 min would evict
// inactive queries before they could be restored offline.
const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: SEVEN_DAYS,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})
