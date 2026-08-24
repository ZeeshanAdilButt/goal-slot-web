'use client'

import { motion } from 'framer-motion'
import {
  Ban,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MailCheck,
  MailX,
  MoreHorizontal,
  ShieldCheck,
  ShieldX,
  Smartphone,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loading } from '@/components/ui/loading'

import { getPlanBadge, getPlanDisplay, getRoleBadge, getRoleIcon } from '../utils/badges'
import { ModalType, User } from '../utils/types'

export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 500]

interface AdminUsersTableProps {
  users: User[]
  isLoading: boolean
  selectedUsers: string[]
  actionLoading: string | null
  isSuperAdmin: boolean
  currentPage: number
  totalPages: number
  totalUsers: number
  pageSize: number
  onToggleSelectAll: () => void
  onToggleSelectUser: (userId: string) => void
  onOpenModal: (type: ModalType, user?: User) => void
  onQuickEnable: (user: User) => void
  onToggleEmailVerified: (user: User) => void
  onPromote: (userId: string) => void
  onDemote: (userId: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function AdminUsersTable({
  users,
  isLoading,
  selectedUsers,
  actionLoading,
  isSuperAdmin,
  currentPage,
  totalPages,
  totalUsers,
  pageSize,
  onToggleSelectAll,
  onToggleSelectUser,
  onOpenModal,
  onQuickEnable,
  onToggleEmailVerified,
  onPromote,
  onDemote,
  onPageChange,
  onPageSizeChange,
}: AdminUsersTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-zinc-200 bg-white shadow-sm"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loading size="sm" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Users className="mb-4 h-16 w-16" />
          <p className="font-bold">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
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
                <th
                  className="px-4 py-3 text-left text-sm font-bold uppercase"
                  title="Set once the mobile app's push registration completes for this user, which requires them to have granted notification permission - a lower bound, not an exact figure."
                >
                  Platform
                </th>
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
                          <Ban className="h-3 w-3" />
                          Disabled
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3" />
                          Active
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
                      onClick={() => onToggleEmailVerified(user)}
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
                          <MailCheck className="h-3 w-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <MailX className="h-3 w-3" />
                          Unverified
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    {user.usesMobileApp ? (
                      <span className="inline-flex items-center gap-1 border-2 border-sky-400 bg-sky-200 px-2 py-1 text-xs font-bold uppercase text-sky-800">
                        <Smartphone className="h-3 w-3" />
                        Mobile
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
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
                          <DropdownMenuContent align="end" collisionPadding={12} className="w-56">
                            <DropdownMenuItem onClick={() => onOpenModal('details', user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Plan Assignment */}
                            <DropdownMenuItem onClick={() => onOpenModal('assignPlan', user)}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Assign Plan
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Enable/Disable */}
                            {user.isDisabled ? (
                              <DropdownMenuItem onClick={() => onQuickEnable(user)} className="text-green-600">
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

                            {/* Role Management - Super Admin Only */}
                            {isSuperAdmin && user.role !== 'SUPER_ADMIN' && (
                              <>
                                <DropdownMenuSeparator />
                                {user.role === 'USER' ? (
                                  <DropdownMenuItem onClick={() => onPromote(user.id)} className="text-purple-600">
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Promote to Admin
                                  </DropdownMenuItem>
                                ) : (
                                  user.role === 'ADMIN' && (
                                    <DropdownMenuItem onClick={() => onDemote(user.id)} className="text-orange-600">
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
        </div>
      )}

      {/* Pagination + page size */}
      {!isLoading && users.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-medium">
            Page {currentPage} of {totalPages} ({totalUsers} users · showing {users.length})
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold uppercase">
              Per page
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="border border-zinc-200 bg-white px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            {totalPages > 1 && (
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
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
