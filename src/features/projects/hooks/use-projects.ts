import { taskQueries } from '@/features/tasks/utils/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { projectsApi, type ProjectRoleValue } from '@/lib/api'

import type {
  ProjectInvite,
  ProjectInviteLink,
  ProjectMember,
  ProjectSummary,
  SendInvitesResult,
} from '../utils/types'

export const projectQueries = {
  all: ['projects'] as const,
  members: (id: string) => ['projects', id, 'members'] as const,
  invites: (id: string) => ['projects', id, 'invites'] as const,
  invitePreview: (token: string) => ['project-invite', token] as const,
}

const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  if (typeof message === 'string' && message.trim()) return message
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  return fallback
}

/**
 * Projects I belong to. One request per Tasks visit (5 minute staleTime from
 * the shared client), refreshed only by invalidation after a mutation; no
 * polling. A failure is treated as "no projects" so the personal page never
 * breaks because of this list.
 */
export function useProjectsQuery() {
  return useQuery({
    queryKey: projectQueries.all,
    queryFn: async () => {
      const res = await projectsApi.list()
      return (res.data as ProjectSummary[]) ?? []
    },
  })
}

export function useProjectMembersQuery(projectId: string | null | undefined) {
  return useQuery({
    queryKey: projectQueries.members(projectId ?? ''),
    queryFn: async () => {
      const res = await projectsApi.members(projectId as string)
      return (res.data as ProjectMember[]) ?? []
    },
    enabled: !!projectId,
  })
}

export function useProjectInvitesQuery(projectId: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: projectQueries.invites(projectId ?? ''),
    queryFn: async () => {
      const res = await projectsApi.invites(projectId as string)
      return (res.data as ProjectInvite[]) ?? []
    },
    enabled: !!projectId && enabled,
  })
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      const res = await projectsApi.create(data)
      return res.data as ProjectSummary
    },
    onSuccess: () => toast.success('Project created'),
    onError: (error) => toast.error(errorMessage(error, 'Could not create the project')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectQueries.all }),
  })
}

export function useUpdateProjectMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string; color?: string; archived?: boolean }) => projectsApi.update(projectId, data),
    onSuccess: (_data, vars) => {
      toast.success(vars.archived ? 'Project archived' : 'Project updated')
      // Task cards carry the project name and color.
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update the project')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectQueries.all }),
  })
}

export function useDeleteProjectMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      toast.success('Project deleted')
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete the project')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectQueries.all }),
  })
}

export function useUpdateMemberRoleMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRoleValue }) =>
      projectsApi.updateMember(projectId, userId, role),
    onSuccess: () => toast.success('Role updated'),
    onError: (error) => toast.error(errorMessage(error, 'Could not change the role')),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueries.members(projectId) })
      queryClient.invalidateQueries({ queryKey: projectQueries.all })
    },
  })
}

/** Remove a member (ADMIN) or leave (pass your own userId). */
export function useRemoveMemberMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId }: { userId: string; leaving?: boolean }) => projectsApi.removeMember(projectId, userId),
    onSuccess: (_data, vars) => toast.success(vars.leaving ? 'You left the project' : 'Member removed'),
    onError: (error) => toast.error(errorMessage(error, 'Could not remove the member')),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueries.members(projectId) })
      queryClient.invalidateQueries({ queryKey: projectQueries.all })
      // Their assigned tasks in this project are now unassigned.
      queryClient.invalidateQueries({ queryKey: taskQueries.all })
    },
  })
}

export function useSendInvitesMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { emails: string[]; role: ProjectRoleValue }) => {
      const res = await projectsApi.invite(projectId, data)
      return res.data as SendInvitesResult
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not send the invites')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectQueries.invites(projectId) }),
  })
}

export function useInviteLinkMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (role: 'MEMBER' | 'GUEST') => {
      const res = await projectsApi.inviteLink(projectId, role)
      return res.data as ProjectInviteLink
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create the invite link')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectQueries.invites(projectId) }),
  })
}

export function useRevokeInviteLinkMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => projectsApi.revokeInviteLink(projectId),
    onSuccess: () => toast.success('Invite link turned off'),
    onError: (error) => toast.error(errorMessage(error, 'Could not turn off the link')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectQueries.invites(projectId) }),
  })
}

export function useResendInviteMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => projectsApi.resendInvite(projectId, inviteId),
    onSuccess: () => toast.success('Invite sent again'),
    onError: (error) => toast.error(errorMessage(error, 'Could not resend the invite')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectQueries.invites(projectId) }),
  })
}

export function useRevokeInviteMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => projectsApi.revokeInvite(projectId, inviteId),
    onSuccess: () => toast.success('Invite revoked'),
    onError: (error) => toast.error(errorMessage(error, 'Could not revoke the invite')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: projectQueries.invites(projectId) }),
  })
}
