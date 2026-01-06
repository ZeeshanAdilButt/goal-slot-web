import {
  fetchMyShares,
  fetchPendingInvites,
  fetchSharedUserGoals,
  fetchSharedUserTimeEntries,
  fetchSharedWithMe,
  sharingQueries,
} from '@/features/sharing/utils/queries'
import { useQuery } from '@tanstack/react-query'

export function useMySharesQuery() {
  return useQuery({
    queryKey: sharingQueries.myShares(),
    queryFn: fetchMyShares,
  })
}

export function usePendingInvitesQuery() {
  return useQuery({
    queryKey: sharingQueries.pendingInvites(),
    queryFn: fetchPendingInvites,
  })
}

export function useSharedWithMeQuery() {
  return useQuery({
    queryKey: sharingQueries.sharedWithMe(),
    queryFn: fetchSharedWithMe,
  })
}

export function useSharedUserTimeEntriesQuery(ownerId: string | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: sharingQueries.sharedTimeEntries(ownerId || '', startDate, endDate),
    queryFn: () => fetchSharedUserTimeEntries(ownerId!, startDate, endDate),
    enabled: !!ownerId,
  })
}

export function useSharedUserGoalsQuery(ownerId: string | null) {
  return useQuery({
    queryKey: sharingQueries.sharedGoals(ownerId || ''),
    queryFn: () => fetchSharedUserGoals(ownerId!),
    enabled: !!ownerId,
  })
}
