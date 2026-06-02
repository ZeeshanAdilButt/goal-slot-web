import {
  Ban,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Mail,
  MailCheck,
  MailX,
  MoreHorizontal,
  ShieldCheck,
  ShieldX,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import { usersApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loading } from '@/components/ui/loading'

import type { AdminModalType, AdminUser } from '../utils/types'

interface AdminUserTableProps {
  users: AdminUser[]
  isLoading: boolean
  selectedUsers: string[]
  isSuperAdmin: boolean
  actionLoading: string | null
  currentPage: number
  totalPages: number
  totalUsers: number
  onToggleSelectAll: () => void
  onToggleSelectUser: (id: string) => void
  onOpenModal: (type: AdminModalType, user?: AdminUser) => void
  onPageChange: (page: number) => void
  onActionLoadingChange: (id: string | null) => void
  onReload: () => void
}

export function AdminUserTable({
  users,
  isLoading,
  selectedUsers,
  isSuperAdmin,
  actionLoading,
  currentPage,
  totalPages,
  totalUsers,
  onToggleSelectAll,
  onToggleSelectUser,
  onOpenModal,
  onPageChange,
  onActionLoadingChange,
  onReload,
}: AdminUserTableProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'ADMIN':
        return <ShieldCheck className="h-4 w-4 text-purple-500" />
      default:
        return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'border-yellow-400 bg-yellow-200 text-yellow-800',
      ADMIN: 'border-purple-400 bg-purple-200 text-purple-800',
      USER: 'border-gray-400 bg-gray-200 text-gray-800',
    }
    return colors[role] || colors.USER
  }

  const getPlanDisplay = (plan: string) => {
    switch (plan) {
      case 'BASIC':
        return 'PRO'
      case 'PRO':
        return 'MAX'
      default:
        return plan
    }
  }

  const getPlanBadge = (plan: string, unlimitedAccess: boolean, adminAssigned?: string) => {
    if (unlimitedAccess && adminAssigned) return 'border-emerald-400 bg-emerald-200 text-emerald-800'
    switch (getPlanDisplay(plan)) {
      case 'MAX':
        return 'border-black bg-primary text-black'
      case 'PRO':
        return 'border-blue-400 bg-blue-200 text-blue-800'
      default:
        return 'border-gray-400 bg-gray-200 text-gray-800'
    }
  }

  const handleToggleEmailVerified = async (user: AdminUser) => {
    onActionLoadingChange(user.id)
    try {
      await usersApi.setEmailVerified(user.id, { emailVerified: !user.emailVerified })
      toast.success(user.emailVerified ? 'Email marked as unverified' : 'Email verified')
      onReload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update email verification')
    } finally {
      onActionLoadingChange(null)
    }
  }

  const handlePromote = async (userId: string) => {
    if (!confirm('Are you sure you want to promote this user to Admin?')) return
    onActionLoadingChange(userId)
    try {
      await usersApi.promote(userId)
      toast.success('User promoted to Admin')
      onReload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to promote user')
    } finally {
      onActionLoadingChange(null)
    }
  }

  const handleDemote = async (userId: string) => {
    if (!confirm('Are you sure you want to demote this admin to User?')) return
    onActionLoadingChange(userId)
    try {
      await usersApi.demote(userId)
      toast.success('Admin demoted to User')
      onReload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to demote admin')
    } finally {
      onActionLoadingChange(null)
    }
  }

  const handleQuickEnable = async (user: AdminUser) => {
    onActionLoadingChange(user.id)
    try {
      await usersApi.toggleStatus(user.id, { isDisabled: false })
      toast.success('User enabled')
      onReload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enable user')
    } finally {
      onActionLoadingChange(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading size="sm" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Users className="mb-4 h-16 w-16" />
        <p className="font-bold">No users found</p>
      </div>
    )
  }

  return (
    <div className="overflow-visible">
      <table className="w-full">
        <thead className="bg-black text-white">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={users.length > 0 && selectedUsers.length === users.length}
                onChange={onToggleSelectAll}
                className="h-5 w-5 border border-zinc-200 accent-primary"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-bold uppercase">User</th>
            <th className="px-4 py-3 text-left text-sm font-bold uppercase">Status</th>
            <th className="px-4 py-3 text-left text-sm font-bold uppercase">Role</th>
            <th className="px-4 py-3 text-left text-sm font-bold uppercase">Plan</th>
            <th className="px-4 py-3 text-left text-sm font-bold uppercase">Verified</th>
            <th className="px-4 py-3 text-left text-sm font-bold uppercase">Joined</th>
            <th className="px-4 py-3 text-right text-sm font-bold uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {users.map((user) => (
            <tr
              key={user.id}
              className={cn('transition-colors hover:bg-gray-50', user.isDisabled && 'bg-red-50 opacity-75')}
            >
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => onToggleSelectUser(user.id)}
                  className="h-5 w-5 border border-zinc-200 accent-primary"
                />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center border border-zinc-200 text-lg font-black',
                      user.isDisabled ? 'bg-gray-300' : 'bg-primary',
                    )}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{user.name}</p>
                    <p className="flex items-center gap-1 text-sm text-gray-500">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 border-2 px-2 py-1 text-xs font-bold uppercase',
                    user.isDisabled
                      ? 'border-red-400 bg-red-200 text-red-800'
                      : 'border-green-400 bg-green-200 text-green-800',
                  )}
                >
                  {user.isDisabled ? (
                    <>
                      <Ban className="h-3 w-3" /> Disabled
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3 w-3" /> Active
                    </>
                  )}
                </span>
              </td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 border-2 px-2 py-1 text-xs font-bold uppercase',
                    getRoleBadge(user.role),
                  )}
                >
                  {getRoleIcon(user.role)}
                  {user.role.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'border-2 px-2 py-1 text-xs font-bold uppercase',
                      getPlanBadge(user.plan, user.unlimitedAccess, user.adminAssignedPlan),
                    )}
                  >
                    {user.adminAssignedPlan ? `${getPlanDisplay(user.plan)} (ADMIN)` : getPlanDisplay(user.plan)}
                  </span>
                  {user.userType === 'INTERNAL' && <span className="text-xs text-green-600">INTERNAL</span>}
                </div>
              </td>
              <td className="px-4 py-4">
                <button
                  onClick={() => handleToggleEmailVerified(user)}
                  disabled={actionLoading === user.id}
                  className={cn(
                    'inline-flex items-center gap-1 border-2 px-2 py-1 text-xs font-bold uppercase transition-colors',
                    user.emailVerified
                      ? 'border-green-400 bg-green-200 text-green-800 hover:bg-green-300'
                      : 'border-orange-400 bg-orange-200 text-orange-800 hover:bg-orange-300',
                  )}
                >
                  {actionLoading === user.id ? (
                    <Loading size="sm" className="h-3 w-3" />
                  ) : user.emailVerified ? (
                    <>
                      <MailCheck className="h-3 w-3" /> Verified
                    </>
                  ) : (
                    <>
                      <MailX className="h-3 w-3" /> Unverified
                    </>
                  )}
                </button>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-end gap-2">
                  {actionLoading === user.id ? (
                    <Loading size="sm" className="h-5 w-5" />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="cursor-pointer border border-zinc-200 p-2 transition-colors hover:bg-gray-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => onOpenModal('details', user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onOpenModal('assignPlan', user)}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Assign Plan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isDisabled ? (
                          <DropdownMenuItem onClick={() => handleQuickEnable(user)} className="text-green-600">
                            <UserCheck className="mr-2 h-4 w-4" />
                            Enable User
                          </DropdownMenuItem>
                        ) : (
                          user.role !== 'SUPER_ADMIN' && (
                            <DropdownMenuItem onClick={() => onOpenModal('disable', user)} className="text-red-600">
                              <Ban className="mr-2 h-4 w-4" />
                              Disable User
                            </DropdownMenuItem>
                          )
                        )}
                        {isSuperAdmin && user.role !== 'SUPER_ADMIN' && (
                          <>
                            <DropdownMenuSeparator />
                            {user.role === 'USER' ? (
                              <DropdownMenuItem onClick={() => handlePromote(user.id)} className="text-purple-600">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Promote to Admin
                              </DropdownMenuItem>
                            ) : (
                              user.role === 'ADMIN' && (
                                <DropdownMenuItem onClick={() => handleDemote(user.id)} className="text-orange-600">
                                  <ShieldX className="mr-2 h-4 w-4" />
                                  Demote to User
                                </DropdownMenuItem>
                              )
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-medium">
            Page {currentPage} of {totalPages} ({totalUsers} users)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="border border-zinc-200 p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="border border-zinc-200 p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
