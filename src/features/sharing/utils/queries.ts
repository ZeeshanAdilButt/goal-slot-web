import { sharingApi } from '@/lib/api'

export const sharingQueries = {
  all: ['sharing'] as const,
  myShares: () => [...sharingQueries.all, 'my-shares'] as const,
  pendingInvites: () => [...sharingQueries.all, 'pending-invites'] as const,
  sharedWithMe: () => [...sharingQueries.all, 'shared-with-me'] as const,
  sharedTimeEntries: (ownerId: string, startDate: string, endDate: string) =>
    [...sharingQueries.all, 'shared-time-entries', ownerId, startDate, endDate] as const,
  sharedGoals: (ownerId: string) => [...sharingQueries.all, 'shared-goals', ownerId] as const,
}

export const fetchMyShares = async () => {
  const res = await sharingApi.getMyShares()
  return res.data
}

export const fetchPendingInvites = async () => {
  const res = await sharingApi.getPendingInvites()
  return res.data
}

export const fetchSharedWithMe = async () => {
  const res = await sharingApi.getSharedWithMe()
  return res.data
}

export const fetchSharedUserTimeEntries = async (ownerId: string, startDate: string, endDate: string) => {
  const res = await sharingApi.getSharedUserTimeEntries(ownerId, startDate, endDate)
  return res.data
}

export const fetchSharedUserGoals = async (ownerId: string) => {
  const res = await sharingApi.getSharedUserGoals(ownerId)
  return res.data
}
