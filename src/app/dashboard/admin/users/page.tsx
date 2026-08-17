'use client'

import { useEffect, useState } from 'react'

import { motion } from 'framer-motion'
import { Ban, Crown, MailCheck, Search, Smartphone, Sparkles, UserCheck, UserPlus, Users } from 'lucide-react'

import { BulkInviteModal } from '@/components/bulk-invite-modal'

import { useAuthStore } from '@/lib/store'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'
import { StatCard } from '@/components/ui/stat-card'

import { AdminUsersTable, PAGE_SIZE_OPTIONS } from '@/features/admin-users/components/admin-users-table'
import { AssignPlanModal } from '@/features/admin-users/components/assign-plan-modal'
import { CreateUserModal } from '@/features/admin-users/components/create-user-modal'
import { DisableUserModal } from '@/features/admin-users/components/disable-user-modal'
import { UserDetailsModal } from '@/features/admin-users/components/user-details-modal'
import {
  useAdminUserStatsQuery,
  useAdminUsersQuery,
  useAssignPlanMutation,
  useBulkAssignPlanMutation,
  useCreateInternalUserMutation,
  useDemoteUserMutation,
  useInvalidateAdminUsers,
  usePromoteUserMutation,
  useSetEmailVerifiedMutation,
  useToggleUserStatusMutation,
} from '@/features/admin-users/hooks/use-admin-users'
import { ModalType, PlanValue, User } from '@/features/admin-users/utils/types'

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false)
  const [actionLoadingUserId, setActionLoadingUserId] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Selecting a different page/filter invalidates any in-progress bulk selection.
  useEffect(() => {
    if (currentPage !== 1) {
      setSelectedUserIds([])
    }
  }, [currentPage, debouncedSearch, pageSize])

  const { data: usersPage, isLoading } = useAdminUsersQuery(currentPage, pageSize, debouncedSearch)
  const { data: stats } = useAdminUserStatsQuery()
  const users = usersPage?.users ?? []
  const totalPages = usersPage?.totalPages ?? 1
  const totalUsers = usersPage?.totalUsers ?? 0

  const invalidate = useInvalidateAdminUsers()
  const createUserMutation = useCreateInternalUserMutation()
  const toggleStatusMutation = useToggleUserStatusMutation()
  const assignPlanMutation = useAssignPlanMutation()
  const bulkAssignPlanMutation = useBulkAssignPlanMutation()
  const setEmailVerifiedMutation = useSetEmailVerifiedMutation()
  const promoteMutation = usePromoteUserMutation()
  const demoteMutation = useDemoteUserMutation()

  const closeModal = () => {
    setModalType(null)
    setSelectedUser(null)
  }

  const openModal = (type: ModalType, user?: User) => {
    setModalType(type)
    setSelectedUser(user || null)
  }

  const toggleSelectAll = () => {
    setSelectedUserIds(selectedUserIds.length === users.length ? [] : users.map((u) => u.id))
  }

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleQuickEnable = (user: User) => {
    setActionLoadingUserId(user.id)
    toggleStatusMutation.mutate(
      { userId: user.id, isDisabled: false },
      { onSettled: () => setActionLoadingUserId(null) },
    )
  }

  const handleToggleEmailVerified = (user: User) => {
    setActionLoadingUserId(user.id)
    setEmailVerifiedMutation.mutate(
      { userId: user.id, emailVerified: !user.emailVerified },
      { onSettled: () => setActionLoadingUserId(null) },
    )
  }

  const handlePromote = (userId: string) => {
    if (!confirm('Are you sure you want to promote this user to Admin?')) return
    setActionLoadingUserId(userId)
    promoteMutation.mutate(userId, { onSettled: () => setActionLoadingUserId(null) })
  }

  const handleDemote = (userId: string) => {
    if (!confirm('Are you sure you want to demote this admin to User?')) return
    setActionLoadingUserId(userId)
    demoteMutation.mutate(userId, { onSettled: () => setActionLoadingUserId(null) })
  }

  return (
    <PageShell className="max-w-none">
      <PageHeader
        eyebrow="Admin"
        title="User Management"
        description="Manage users, roles, subscriptions, and access permissions"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setBulkInviteOpen(true)} variant="secondary">
              <Users className="h-4 w-4" />
              Bulk Invite
            </Button>
            <Button onClick={() => openModal('create')} variant="brand">
              <UserPlus className="h-4 w-4" />
              Add Internal User
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
          <StatCard label="Total" value={stats.totalUsers} icon={<Users />} accent="neutral" />
          <StatCard label="Active" value={stats.activeUsers} icon={<UserCheck />} accent="success" />
          <StatCard label="Disabled" value={stats.disabledUsers} icon={<Ban />} accent="danger" />
          <StatCard label="Verified" value={stats.verifiedUsers} icon={<MailCheck />} accent="neutral" />
          <div title="Users who granted notification permission in the mobile app. A lower bound — some mobile users decline that prompt and aren't counted here.">
            <StatCard label="Mobile" value={stats.mobileAppUsers} icon={<Smartphone />} accent="neutral" />
          </div>
          <StatCard label="Max" value={stats.byPlan.pro} icon={<Crown />} accent="brand" />
          <StatCard label="Pro" value={stats.byPlan.basic} icon={<Sparkles />} accent="neutral" />
          <StatCard label="Free" value={stats.byPlan.free} icon={<Users />} accent="neutral" />
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
            className="w-full border border-zinc-200 py-3 pl-12 pr-4 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <label className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase">
          Per page
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
              setSelectedUserIds([])
            }}
            className="border border-zinc-200 bg-white px-2 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        {selectedUserIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 border border-zinc-200 bg-white px-4 py-2 shadow-sm"
          >
            <span className="font-bold">{selectedUserIds.length} selected</span>
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

      <AdminUsersTable
        users={users}
        isLoading={isLoading}
        selectedUsers={selectedUserIds}
        actionLoading={actionLoadingUserId}
        isSuperAdmin={isSuperAdmin}
        currentPage={currentPage}
        totalPages={totalPages}
        totalUsers={totalUsers}
        pageSize={pageSize}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectUser={toggleSelectUser}
        onOpenModal={openModal}
        onQuickEnable={handleQuickEnable}
        onToggleEmailVerified={handleToggleEmailVerified}
        onPromote={handlePromote}
        onDemote={handleDemote}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
          setSelectedUserIds([])
        }}
      />

      {/* Modals */}
      <Dialog open={modalType !== null} onOpenChange={(open) => !open && closeModal()}>
        {modalType === 'create' && (
          <CreateUserModal
            isSuperAdmin={isSuperAdmin}
            isSubmitting={createUserMutation.isPending}
            onCancel={closeModal}
            onSubmit={(data) => createUserMutation.mutate(data, { onSuccess: closeModal })}
          />
        )}

        {modalType === 'disable' && selectedUser && (
          <DisableUserModal
            user={selectedUser}
            isSubmitting={toggleStatusMutation.isPending}
            onCancel={closeModal}
            onConfirm={(reason) => {
              if (!reason) return
              toggleStatusMutation.mutate(
                { userId: selectedUser.id, isDisabled: true, reason },
                { onSuccess: closeModal },
              )
            }}
          />
        )}

        {modalType === 'assignPlan' && selectedUser && (
          <AssignPlanModal
            mode="single"
            user={selectedUser}
            isSubmitting={assignPlanMutation.isPending}
            onCancel={closeModal}
            onConfirm={(plan: PlanValue, note: string) =>
              assignPlanMutation.mutate(
                { userId: selectedUser.id, userName: selectedUser.name, plan, note: note || undefined },
                { onSuccess: closeModal },
              )
            }
          />
        )}

        {modalType === 'bulkAssignPlan' && (
          <AssignPlanModal
            mode="bulk"
            userCount={selectedUserIds.length}
            isSubmitting={bulkAssignPlanMutation.isPending}
            onCancel={closeModal}
            onConfirm={(plan: PlanValue, note: string) =>
              bulkAssignPlanMutation.mutate(
                { userIds: selectedUserIds, plan, note: note || undefined },
                {
                  onSuccess: () => {
                    closeModal()
                    setSelectedUserIds([])
                  },
                },
              )
            }
          />
        )}

        {modalType === 'details' && selectedUser && <UserDetailsModal user={selectedUser} onClose={closeModal} />}
      </Dialog>

      <BulkInviteModal
        isOpen={bulkInviteOpen}
        onClose={() => setBulkInviteOpen(false)}
        onComplete={() => {
          invalidate.users()
          invalidate.stats()
        }}
      />
    </PageShell>
  )
}
