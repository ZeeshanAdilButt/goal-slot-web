import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { whiteboardsApi } from '@/lib/api/whiteboards'

import type { WhiteboardShare, WhiteboardShareState } from '../types'
import { SHARED_WHITEBOARDS_QUERY_KEY } from './use-whiteboards'

const shareStateKey = (whiteboardId: string) => ['whiteboards', whiteboardId, 'share']

export function useWhiteboardShareState(whiteboardId: string | null) {
  return useQuery({
    queryKey: whiteboardId ? shareStateKey(whiteboardId) : ['whiteboards', 'none', 'share'],
    queryFn: async () => {
      if (!whiteboardId) return null
      const { data } = await whiteboardsApi.getShareState(whiteboardId)
      return data as WhiteboardShareState
    },
    enabled: !!whiteboardId,
  })
}

export function useEnableWhiteboardPublicLinkMutation(whiteboardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await whiteboardsApi.enablePublicLink(whiteboardId)
      return data as { token: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareStateKey(whiteboardId) })
    },
    onError: () => toast.error('Could not enable public link'),
  })
}

export function useRevokeWhiteboardPublicLinkMutation(whiteboardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await whiteboardsApi.revokePublicLink(whiteboardId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareStateKey(whiteboardId) })
    },
    onError: () => toast.error('Could not turn off public link'),
  })
}

export function useInviteWhiteboardShareMutation(whiteboardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await whiteboardsApi.invite(whiteboardId, email)
      return data as WhiteboardShare
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareStateKey(whiteboardId) })
      queryClient.invalidateQueries({ queryKey: SHARED_WHITEBOARDS_QUERY_KEY })
      toast.success('Invite sent')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not send invite'
      toast.error(typeof msg === 'string' ? msg : 'Could not send invite')
    },
  })
}

export function useRevokeWhiteboardShareMutation(whiteboardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shareId: string) => {
      await whiteboardsApi.revokeInvite(whiteboardId, shareId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareStateKey(whiteboardId) })
      queryClient.invalidateQueries({ queryKey: SHARED_WHITEBOARDS_QUERY_KEY })
      toast.success('Access revoked')
    },
    onError: () => toast.error('Could not revoke access'),
  })
}
