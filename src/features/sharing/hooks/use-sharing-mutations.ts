import { sharingQueries } from '@/features/sharing/utils/queries'
import { CreatePublicLinkParams, CreateShareForm, PublicLink, ShareInviteResult } from '@/features/sharing/utils/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { sharingApi } from '@/lib/api'

export function useShareMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateShareForm) => {
      const res = await sharingApi.share(data)
      return res.data as ShareInviteResult
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: sharingQueries.all })
      if (result.emailSent) {
        toast.success(`Invite sent to ${variables.email}!`)
      } else {
        toast.error(`Failed to send email to ${variables.email}. Please share the link manually.`, { duration: 5000 })
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invite')
    },
  })
}

export function useCreatePublicLinkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data?: CreatePublicLinkParams) => {
      const res = await sharingApi.createPublicLink(data)
      return res.data as PublicLink
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingQueries.all })
      toast.success('Public link created!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create public link')
    },
  })
}

export function useDeletePublicLinkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shareId: string) => {
      await sharingApi.deletePublicLink(shareId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingQueries.all })
      toast.success('Public link deleted')
    },
    onError: () => {
      toast.error('Failed to delete public link')
    },
  })
}

export function useRevokeShareMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (shareId: string) => {
      await sharingApi.revoke(shareId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingQueries.all })
      toast.success('Access revoked')
    },
    onError: () => {
      toast.error('Failed to revoke access')
    },
  })
}

export function useAcceptInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inviteId: string) => {
      await sharingApi.acceptInvite(inviteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingQueries.all })
      toast.success('Invite accepted!')
    },
    onError: () => {
      toast.error('Failed to accept invite')
    },
  })
}

export function useDeclineInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inviteId: string) => {
      await sharingApi.declineInvite(inviteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharingQueries.all })
      toast.success('Invite declined')
    },
    onError: () => {
      toast.error('Failed to decline invite')
    },
  })
}
