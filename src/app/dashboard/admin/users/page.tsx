'use client'

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'

import { motion } from 'framer-motion'
import {
  Ban,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Mail,
  MailCheck,
  MailX,
  MoreHorizontal,
  Search,
  ShieldCheck,
  ShieldX,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import { usersApi } from '@/lib/api'
import { GoalSlotSpinner } from '@/components/goalslot-logo'

import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loading } from '@/components/ui/loading'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  userType: 'INTERNAL' | 'EXTERNAL'
  plan: 'FREE' | 'BASIC' | 'PRO'
  unlimitedAccess: boolean
  // Subscription fields
  subscriptionStatus?: string
  subscriptionEndDate?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  // Billing tracking
  firstPaymentDate?: string
  lastPaymentDate?: string
  invoicePending?: boolean
  lastInvoiceId?: string
  // Account status
  isDisabled: boolean
  disabledAt?: string
  disabledReason?: string
  emailVerified: boolean
  emailVerifiedAt?: string
  // Admin assigned plan
  adminAssignedPlan?: string
  adminAssignedPlanAt?: string
  adminAssignedPlanBy?: string
  adminAssignedPlanNote?: string
  createdAt: string
  updatedAt: string
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  disabledUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  byPlan: {
    free: number
    basic: number
    pro: number
  }
}

interface CreateUserData {
  email: string
  password: string
  name: string
  role: 'USER' | 'ADMIN'
}

type ModalType = 'create' | 'disable' | 'assignPlan' | 'bulkAssignPlan' | 'details' | null

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Create user form
  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    role: 'USER',
  })

  // Disable user form
  const [disableReason, setDisableReason] = useState('')

  // Assign plan form
  const [assignPlan, setAssignPlan] = useState<'FREE' | 'BASIC' | 'PRO'>('FREE')
  const [assignPlanNote, setAssignPlanNote] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (currentPage !== 1) {
       setSelectedUsers([]);
    }
    loadUsers()
    loadStats()
  }, [currentPage, debouncedSearch])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const response = await usersApi.listUsers(currentPage, 20, debouncedSearch || undefined)
      setUsers(response.data.users || response.data)
      setTotalPages(response.data.pagination?.totalPages || 1)
      setTotalUsers(response.data.pagination?.total || 0)
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.')
      } else {
        toast.error('Failed to load users')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await usersApi.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error('All fields are required')
      return
    }

    setIsSubmitting(true)
    try {
      await usersApi.createInternal(newUser)
      toast.success('User created successfully')
      closeModal()
      setNewUser({ email: '', password: '', name: '', role: 'USER' })
      loadUsers()
      loadStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkAssignPlan = async () => {
    if (selectedUsers.length === 0) return

    setIsSubmitting(true)
    try {
      await usersApi.bulkAssignPlan({
        userIds: selectedUsers,
        plan: assignPlan,
        note: assignPlanNote || undefined,
      })
      toast.success(`${assignPlan} plan assigned to ${selectedUsers.length} users`)
      closeModal()
      setAssignPlan('FREE')
      setAssignPlanNote('')
      setSelectedUsers([])
      loadUsers()
      loadStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to bulk assign plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (user: User, disable: boolean) => {
    if (disable && !disableReason) {
      toast.error('Please provide a reason for disabling the user')
      return
    }

    setIsSubmitting(true)
    try {
      await usersApi.toggleStatus(user.id, {
        isDisabled: disable,
        reason: disable ? disableReason : undefined,
      })
      toast.success(disable ? 'User disabled' : 'User enabled')
      closeModal()
      setDisableReason('')
      loadUsers()
      loadStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignPlan = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      await usersApi.assignPlan(selectedUser.id, {
        plan: assignPlan,
        note: assignPlanNote || undefined,
      })
      toast.success(`${assignPlan} plan assigned to ${selectedUser.name}`)
      closeModal()
      setAssignPlan('FREE')
      setAssignPlanNote('')
      loadUsers()
      loadStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleEmailVerified = async (user: User) => {
    setActionLoading(user.id)
    try {
      await usersApi.setEmailVerified(user.id, { emailVerified: !user.emailVerified })
      toast.success(user.emailVerified ? 'Email marked as unverified' : 'Email verified')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update email verification')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePromote = async (userId: string) => {
    if (!confirm('Are you sure you want to promote this user to Admin?')) return

    setActionLoading(userId)
    try {
      await usersApi.promote(userId)
      toast.success('User promoted to Admin')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to promote user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDemote = async (userId: string) => {
    if (!confirm('Are you sure you want to demote this admin to User?')) return

    setActionLoading(userId)
    try {
      await usersApi.demote(userId)
      toast.success('Admin demoted to User')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to demote admin')
    } finally {
      setActionLoading(null)
    }
  }

  const handleQuickEnable = async (user: User) => {
    setActionLoading(user.id)
    try {
      await usersApi.toggleStatus(user.id, { isDisabled: false })
      toast.success('User enabled')
      loadUsers()
      loadStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enable user')
    } finally {
      setActionLoading(null)
    }
  }

  const openModal = (type: ModalType, user?: User) => {
    setModalType(type)
    setSelectedUser(user || null)
    if (user && type === 'assignPlan') {
      setAssignPlan(user.plan)
    }
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedUser(null)
  }

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
      SUPER_ADMIN: 'bg-yellow-200 text-yellow-800 border-yellow-400',
      ADMIN: 'bg-purple-200 text-purple-800 border-purple-400',
      USER: 'bg-gray-200 text-gray-800 border-gray-400',
    }
    return colors[role] || colors.USER
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((u) => u.id))
    }
  }

  const toggleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const getPlanBadge = (plan: string, unlimitedAccess: boolean, adminAssigned?: string) => {
    if (unlimitedAccess && adminAssigned) {
      return 'border-emerald-400 bg-emerald-200 text-emerald-800'
    }
    const displayPlan = getPlanDisplay(plan)
    switch (displayPlan) {
      case 'MAX':
        return 'border-black bg-primary text-black'
      case 'PRO':
        return 'border-blue-400 bg-blue-200 text-blue-800'
      default:
        return 'border-gray-400 bg-gray-200 text-gray-800'
    }
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

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">User Management</h1>
          <p className="mt-1 text-gray-600">Manage users, roles, subscriptions, and access permissions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal('create')}
          className="flex items-center gap-2 border-4 border-black bg-primary px-4 py-2 font-bold shadow-brutal transition-all hover:shadow-brutal-sm"
        >
          <UserPlus className="h-5 w-5" />
          Add Internal User
        </motion.button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          <div className="border-4 border-black bg-white p-4 shadow-brutal">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Total</span>
            </div>
            <p className="mt-1 text-2xl font-black">{stats.totalUsers}</p>
          </div>
          <div className="border-4 border-black bg-green-100 p-4 shadow-brutal">
            <div className="flex items-center gap-2 text-green-700">
              <UserCheck className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Active</span>
            </div>
            <p className="mt-1 text-2xl font-black text-green-800">{stats.activeUsers}</p>
          </div>
          <div className="border-4 border-black bg-red-100 p-4 shadow-brutal">
            <div className="flex items-center gap-2 text-red-700">
              <Ban className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Disabled</span>
            </div>
            <p className="mt-1 text-2xl font-black text-red-800">{stats.disabledUsers}</p>
          </div>
          <div className="border-4 border-black bg-blue-100 p-4 shadow-brutal">
            <div className="flex items-center gap-2 text-blue-700">
              <MailCheck className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Verified</span>
            </div>
            <p className="mt-1 text-2xl font-black text-blue-800">{stats.verifiedUsers}</p>
          </div>
          <div className="border-4 border-black bg-primary p-4 shadow-brutal">
            <div className="flex items-center gap-2 text-black/70">
              <Crown className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Max</span>
            </div>
            <p className="mt-1 text-2xl font-black">{stats.byPlan.pro}</p>
          </div>
          <div className="border-4 border-black bg-blue-200 p-4 shadow-brutal">
            <div className="flex items-center gap-2 text-blue-800">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Pro</span>
            </div>
            <p className="mt-1 text-2xl font-black text-blue-900">{stats.byPlan.basic}</p>
          </div>
          <div className="border-4 border-black bg-gray-100 p-4 shadow-brutal">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Free</span>
            </div>
            <p className="mt-1 text-2xl font-black text-gray-800">{stats.byPlan.free}</p>
          </div>
        </div>
      )}

      {/* Search and Bulk Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-4 border-black py-3 pl-12 pr-4 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 border-4 border-black bg-white px-4 py-2 shadow-brutal"
          >
            <span className="font-bold">{selectedUsers.length} selected</span>
            <div className="h-6 w-0.5 bg-gray-300" />
            <button
              onClick={() => openModal('bulkAssignPlan')}
              className="text-sm font-bold uppercase hover:text-primary hover:underline"
            >
              Assign Plan
            </button>
          </motion.div>
        )}
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden border-4 border-black bg-white shadow-brutal"
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
          <div className="overflow-visible">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedUsers.length === users.length}
                      onChange={toggleSelectAll}
                      className="h-5 w-5 border-2 border-white accent-primary"
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
              <tbody className="divide-y-2 divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn('transition-colors hover:bg-gray-50', user.isDisabled && 'bg-red-50 opacity-75')}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="h-5 w-5 border-2 border-black accent-primary"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center border-2 border-black text-lg font-black',
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
                                className="cursor-pointer border-2 border-black p-2 transition-colors hover:bg-gray-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => openModal('details', user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Plan Assignment */}
                              <DropdownMenuItem onClick={() => openModal('assignPlan', user)}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Assign Plan
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Enable/Disable */}
                              {user.isDisabled ? (
                                <DropdownMenuItem onClick={() => handleQuickEnable(user)} className="text-green-600">
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Enable User
                                </DropdownMenuItem>
                              ) : (
                                user.role !== 'SUPER_ADMIN' && (
                                  <DropdownMenuItem onClick={() => openModal('disable', user)} className="text-red-600">
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
                                    <DropdownMenuItem
                                      onClick={() => handlePromote(user.id)}
                                      className="text-purple-600"
                                    >
                                      <ShieldCheck className="mr-2 h-4 w-4" />
                                      Promote to Admin
                                    </DropdownMenuItem>
                                  ) : (
                                    user.role === 'ADMIN' && (
                                      <DropdownMenuItem
                                        onClick={() => handleDemote(user.id)}
                                        className="text-orange-600"
                                      >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t-4 border-black bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium">
              Page {currentPage} of {totalPages} ({totalUsers} users)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-2 border-black p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-2 border-black p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <Dialog open={modalType !== null} onOpenChange={(open) => !open && closeModal()}>
        {/* Create User Modal */}
        {modalType === 'create' && (
          <DialogContent className="max-w-md border-4 border-black bg-white shadow-brutal" showCloseButton={true}>
            <DialogHeader className="border-b-4 border-black bg-primary p-4">
              <DialogTitle className="text-xl font-black uppercase">Create Internal User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 p-2 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border-4 border-black px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border-4 border-black px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border-4 border-black px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Role</label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as any })}>
                  <SelectTrigger className="h-auto w-full rounded-none border-4 border-black px-4 py-2 font-medium shadow-none focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    {isSuperAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border-4 border-black px-4 py-2 font-bold transition-colors hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-primary px-4 py-2 font-bold shadow-brutal transition-all hover:shadow-brutal-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <GoalSlotSpinner size="md" />
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Create
                    </>
                  )}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}

        {/* Disable User Modal */}
        {modalType === 'disable' && selectedUser && (
          <DialogContent className="max-w-md border-4 border-black bg-white shadow-brutal" showCloseButton={true}>
            <DialogHeader className="border-b-4 border-black bg-red-500 p-4 text-white">
              <DialogTitle className="text-xl font-black uppercase">Disable User</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 p-2 sm:p-6">
              <p className="text-gray-600">
                You are about to disable <strong>{selectedUser.name}</strong> ({selectedUser.email}). They will not be
                able to log in until re-enabled.
              </p>
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Reason for Disabling *</label>
                <textarea
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  className="w-full border-4 border-black px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Violation of terms of service"
                  rows={3}
                  required
                />
              </div>
              <DialogFooter className="flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border-4 border-black px-4 py-2 font-bold transition-colors hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleToggleStatus(selectedUser, true)}
                  disabled={isSubmitting || !disableReason}
                  className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-red-500 px-4 py-2 font-bold text-white shadow-brutal transition-all hover:bg-red-600 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loading size="sm" className="h-5 w-5" />
                  ) : (
                    <>
                      <Ban className="h-5 w-5" />
                      Disable
                    </>
                  )}
                </button>
              </DialogFooter>
            </div>
          </DialogContent>
        )}

        {/* Assign Plan Modal */}
        {(modalType === 'assignPlan' || modalType === 'bulkAssignPlan') && (
          <DialogContent className="max-w-md border-4 border-black bg-white shadow-brutal" showCloseButton={true}>
            <DialogHeader className="border-b-4 border-black bg-primary p-4">
              <DialogTitle className="text-xl font-black uppercase">
                {modalType === 'bulkAssignPlan' ? `Assign to ${selectedUsers.length} Users` : 'Assign Plan'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 p-2 sm:p-6">
              <p className="text-gray-600">
                {modalType === 'bulkAssignPlan'
                  ? 'Assign a subscription plan to the selected users.'
                  : selectedUser && (
                      <>
                        Assign a subscription plan to <strong>{selectedUser.name}</strong>.
                      </>
                    )}
              </p>
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Plan</label>
                <Select value={assignPlan} onValueChange={(value) => setAssignPlan(value as any)}>
                  <SelectTrigger className="h-auto w-full rounded-none border-4 border-black px-4 py-2 font-medium shadow-none focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="BASIC">Pro ($7/mo - 10 Goals)</SelectItem>
                    <SelectItem value="PRO">Max ($12/mo - Unlimited)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold uppercase">Note (Optional)</label>
                <textarea
                  value={assignPlanNote}
                  onChange={(e) => setAssignPlanNote(e.target.value)}
                  className="w-full border-4 border-black px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Early adopter reward, Contest winner"
                  rows={2}
                />
              </div>
              <DialogFooter className="flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border-4 border-black px-4 py-2 font-bold transition-colors hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={modalType === 'bulkAssignPlan' ? handleBulkAssignPlan : handleAssignPlan}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-primary px-4 py-2 font-bold shadow-brutal transition-all hover:shadow-brutal-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loading size="sm" className="h-5 w-5" />
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Assign
                    </>
                  )}
                </button>
              </DialogFooter>
            </div>
          </DialogContent>
        )}

        {/* User Details Modal */}
        {modalType === 'details' && selectedUser && (
          <DialogContent className="max-w-md border-4 border-black bg-white shadow-brutal" showCloseButton={true}>
            <DialogHeader className="border-b-4 border-black bg-gray-100 p-4">
              <DialogTitle className="text-xl font-black uppercase">User Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 p-2 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center border-4 border-black bg-primary text-2xl font-black">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Role</p>
                  <p className="font-bold">{selectedUser.role.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Type</p>
                  <p className="font-bold">{selectedUser.userType}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Plan</p>
                  <p className="font-bold">{selectedUser.plan}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Status</p>
                  <p className={cn('font-bold', selectedUser.isDisabled ? 'text-red-600' : 'text-green-600')}>
                    {selectedUser.isDisabled ? 'Disabled' : 'Active'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Email Verified</p>
                  <p className={cn('font-bold', selectedUser.emailVerified ? 'text-green-600' : 'text-orange-600')}>
                    {selectedUser.emailVerified ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Unlimited Access</p>
                  <p className="font-bold">{selectedUser.unlimitedAccess ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {selectedUser.isDisabled && selectedUser.disabledReason && (
                <div className="border-4 border-red-300 bg-red-50 p-3">
                  <p className="text-xs font-bold uppercase text-red-600">Disabled Reason</p>
                  <p className="text-red-800">{selectedUser.disabledReason}</p>
                  {selectedUser.disabledAt && (
                    <p className="mt-1 text-xs text-red-600">
                      Disabled on {new Date(selectedUser.disabledAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {selectedUser.adminAssignedPlan && (
                <div className="border-4 border-emerald-300 bg-emerald-50 p-3">
                  <p className="text-xs font-bold uppercase text-emerald-600">Admin Assigned Plan</p>
                  <p className="font-bold text-emerald-800">{selectedUser.adminAssignedPlan}</p>
                  {selectedUser.adminAssignedPlanNote && (
                    <p className="mt-1 text-sm text-emerald-700">{selectedUser.adminAssignedPlanNote}</p>
                  )}
                  {selectedUser.adminAssignedPlanAt && (
                    <p className="mt-1 text-xs text-emerald-600">
                      Assigned on {new Date(selectedUser.adminAssignedPlanAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Subscription & Billing Section */}
              <div className="border-4 border-blue-300 bg-blue-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-blue-600">Subscription & Billing</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-blue-600">Status</p>
                    <p
                      className={cn(
                        'font-bold',
                        selectedUser.subscriptionStatus === 'active'
                          ? 'text-green-600'
                          : selectedUser.subscriptionStatus === 'past_due'
                            ? 'text-orange-600'
                            : selectedUser.subscriptionStatus === 'canceled'
                              ? 'text-red-600'
                              : 'text-gray-600',
                      )}
                    >
                      {selectedUser.subscriptionStatus || 'No subscription'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Subscription Ends</p>
                    <p className="font-medium text-blue-800">
                      {selectedUser.subscriptionEndDate
                        ? new Date(selectedUser.subscriptionEndDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">First Payment</p>
                    <p className="font-medium text-blue-800">
                      {selectedUser.firstPaymentDate
                        ? new Date(selectedUser.firstPaymentDate).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Last Payment</p>
                    <p className="font-medium text-blue-800">
                      {selectedUser.lastPaymentDate
                        ? new Date(selectedUser.lastPaymentDate).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  {selectedUser.invoicePending && (
                    <div className="col-span-2">
                      <p className="font-bold text-orange-600">⚠ Invoice pending payment</p>
                    </div>
                  )}
                  {selectedUser.stripeCustomerId && (
                    <div className="col-span-2 border-t border-blue-200 pt-2">
                      <p className="text-xs text-blue-600">Stripe Customer ID</p>
                      <p className="font-mono text-xs text-blue-800">{selectedUser.stripeCustomerId}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t-2 border-gray-200 pt-4">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Created</p>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Updated</p>
                  <p className="text-sm">{new Date(selectedUser.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="w-full border-4 border-black px-4 py-2 font-bold transition-colors hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
