import { sharingApi } from '@/lib/api'

import { DataShare } from './types'

export const sharingQueries = {
  all: ['sharing'] as const,
  myShares: () => [...sharingQueries.all, 'my-shares'] as const,
  pendingInvites: () => [...sharingQueries.all, 'pending-invites'] as const,
  sharedWithMe: () => [...sharingQueries.all, 'shared-with-me'] as const,
  sharedTimeEntries: (ownerId: string, startDate: string, endDate: string) =>
    [...sharingQueries.all, 'shared-time-entries', ownerId, startDate, endDate] as const,
  sharedGoals: (ownerId: string) => [...sharingQueries.all, 'shared-goals', ownerId] as const,
}

// Transform backend response to frontend DataShare format
const transformShare = (share: any): DataShare => {
  return {
    id: share.id,
    email: share.inviteEmail || share.sharedWith?.email || '',
    accessLevel: share.accessLevel === 'EDIT' ? 'EDIT' : 'VIEW',
    status: share.isAccepted ? ('ACCEPTED' as const) : ('PENDING' as const),
    createdAt: share.createdAt,
    expiresAt: share.inviteExpires || undefined,
    sharedWith: share.sharedWith
      ? {
          id: share.sharedWith.id,
          name: share.sharedWith.name,
          email: share.sharedWith.email,
          avatar: share.sharedWith.avatar || undefined,
        }
      : undefined,
  }
}

export const fetchMyShares = async (): Promise<DataShare[]> => {
  const res = await sharingApi.getMyShares()
  const shares = Array.isArray(res.data) ? res.data : []
  return shares.map(transformShare)
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
