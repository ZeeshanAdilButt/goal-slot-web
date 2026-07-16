import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { notesApi } from '@/lib/api'

import { SHARED_NOTES_QUERY_KEY } from './use-notes'

export interface NoteShareRecipientUser {
  id: string
  name: string
  email: string
  avatar: string | null
}

export interface NoteShareRecipient {
  id: string
  recipientEmail: string
  recipientUserId: string | null
  permission: string
  acceptedAt: string | null
  createdAt: string
  recipientUser: NoteShareRecipientUser | null
}

export interface NoteShareState {
  publicShareToken: string | null
  shares: NoteShareRecipient[]
}

const shareStateKey = (noteId: string) => ['notes', noteId, 'share']

export function useNoteShareState(noteId: string | null) {
  return useQuery({
    queryKey: noteId ? shareStateKey(noteId) : ['notes', 'none', 'share'],
    queryFn: async () => {
      if (!noteId) return null
      const { data } = await notesApi.getShareState(noteId)
      return data as NoteShareState
    },
    enabled: !!noteId,
  })
}

export function useEnablePublicLinkMutation(noteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await notesApi.enablePublicLink(noteId)
      return data as { token: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareStateKey(noteId) })
    },
    onError: () => toast.error('Could not enable public link'),
  })
}

export function useRevokePublicLinkMutation(noteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await notesApi.revokePublicLink(noteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareStateKey(noteId) })
    },
    onError: () => toast.error('Could not turn off public link'),
  })
}

export function useInviteShareMutation(noteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await notesApi.invite(noteId, email)
      return data as NoteShareRecipient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareStateKey(noteId) })
      // Recipient's "Shared with me" list may now include this note if
      // they happen to be the current user (rare, but cheap to refresh).
      queryClient.invalidateQueries({ queryKey: SHARED_NOTES_QUERY_KEY })
      toast.success('Invite sent')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not send invite'
      toast.error(typeof msg === 'string' ? msg : 'Could not send invite')
    },
  })
}

export function useRevokeShareMutation(noteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shareId: string) => {
      await notesApi.revokeInvite(noteId, shareId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareStateKey(noteId) })
      queryClient.invalidateQueries({ queryKey: SHARED_NOTES_QUERY_KEY })
      toast.success('Access revoked')
    },
    onError: () => toast.error('Could not revoke access'),
  })
}
