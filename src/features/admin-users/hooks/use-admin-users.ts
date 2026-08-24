import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { usersApi } from '@/lib/api'

import { CreateUserData, PlanValue, User, UserStats } from '../utils/types'

interface UsersPage {
  users: User[]
  totalPages: number
  totalUsers: number
}

export const adminUsersKeys = {
  list: (page: number, pageSize: number, search: string) => ['admin-users', 'list', page, pageSize, search] as const,
  stats: () => ['admin-users', 'stats'] as const,
}

function extractErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || fallback
}

export function useAdminUsersQuery(page: number, pageSize: number, search: string) {
  return useQuery<UsersPage>({
    queryKey: adminUsersKeys.list(page, pageSize, search),
    queryFn: async () => {
      const response = await usersApi.listUsers(page, pageSize, search || undefined)
      return {
        users: response.data.users || response.data,
        totalPages: response.data.pagination?.totalPages || 1,
        totalUsers: response.data.pagination?.total || 0,
      }
    },
  })
}

export function useAdminUserStatsQuery() {
  return useQuery<UserStats>({
    queryKey: adminUsersKeys.stats(),
    queryFn: async () => (await usersApi.getStats()).data,
  })
}

export function useInvalidateAdminUsers() {
  const queryClient = useQueryClient()
  return {
    users: () => queryClient.invalidateQueries({ queryKey: ['admin-users', 'list'] }),
    stats: () => queryClient.invalidateQueries({ queryKey: adminUsersKeys.stats() }),
  }
}

export function useCreateInternalUserMutation() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (data: CreateUserData) => usersApi.createInternal(data),
    onSuccess: () => {
      toast.success('User created successfully')
      invalidate.users()
      invalidate.stats()
    },
    onError: (error: any) => toast.error(extractErrorMessage(error, 'Failed to create user')),
  })
}

/** Used for both the Disable-user modal and the quick "Enable User" dropdown action. */
export function useToggleUserStatusMutation() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (vars: { userId: string; isDisabled: boolean; reason?: string }) =>
      usersApi.toggleStatus(vars.userId, { isDisabled: vars.isDisabled, reason: vars.reason }),
    onSuccess: (_data, vars) => {
      toast.success(vars.isDisabled ? 'User disabled' : 'User enabled')
      invalidate.users()
      invalidate.stats()
    },
    onError: (error: any) => toast.error(extractErrorMessage(error, 'Failed to update user status')),
  })
}

export function useAssignPlanMutation() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (vars: { userId: string; userName: string; plan: PlanValue; note?: string }) =>
      usersApi.assignPlan(vars.userId, { plan: vars.plan, note: vars.note }),
    onSuccess: (_data, vars) => {
      toast.success(`${vars.plan} plan assigned to ${vars.userName}`)
      invalidate.users()
      invalidate.stats()
    },
    onError: (error: any) => toast.error(extractErrorMessage(error, 'Failed to assign plan')),
  })
}

export function useBulkAssignPlanMutation() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (vars: { userIds: string[]; plan: PlanValue; note?: string }) =>
      usersApi.bulkAssignPlan({ userIds: vars.userIds, plan: vars.plan, note: vars.note }),
    onSuccess: (_data, vars) => {
      toast.success(`${vars.plan} plan assigned to ${vars.userIds.length} users`)
      invalidate.users()
      invalidate.stats()
    },
    onError: (error: any) => toast.error(extractErrorMessage(error, 'Failed to bulk assign plan')),
  })
}

export function useSetEmailVerifiedMutation() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (vars: { userId: string; emailVerified: boolean }) =>
      usersApi.setEmailVerified(vars.userId, { emailVerified: vars.emailVerified }),
    onSuccess: (_data, vars) => {
      toast.success(vars.emailVerified ? 'Email verified' : 'Email marked as unverified')
      invalidate.users()
    },
    onError: (error: any) => toast.error(extractErrorMessage(error, 'Failed to update email verification')),
  })
}

export function usePromoteUserMutation() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (userId: string) => usersApi.promote(userId),
    onSuccess: () => {
      toast.success('User promoted to Admin')
      invalidate.users()
    },
    onError: (error: any) => toast.error(extractErrorMessage(error, 'Failed to promote user')),
  })
}

export function useDemoteUserMutation() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (userId: string) => usersApi.demote(userId),
    onSuccess: () => {
      toast.success('Admin demoted to User')
      invalidate.users()
    },
    onError: (error: any) => toast.error(extractErrorMessage(error, 'Failed to demote admin')),
  })
}
