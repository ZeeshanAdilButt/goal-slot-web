'use client'

import { useEffect, useState } from 'react'

import { motion } from 'framer-motion'
import { Search, UserPlus } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'

import { useAdminUsers } from '../hooks/use-admin-users'
import type { AdminModalType, AdminUser } from '../utils/types'
import { AdminUserModals } from './admin-user-modals'
import { AdminUserStatsBar } from './admin-user-stats'
import { AdminUserTable } from './admin-user-table'

export function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [modalType, setModalType] = useState<AdminModalType>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { users, stats, isLoading, totalPages, totalUsers, reload } = useAdminUsers(currentPage, debouncedSearch)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset selection on page change
  useEffect(() => {
    if (currentPage !== 1) setSelectedUsers([])
  }, [currentPage])

  const openModal = (type: AdminModalType, user?: AdminUser) => {
    setModalType(type)
    setSelectedUser(user || null)
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedUser(null)
  }

  const toggleSelectAll = () => {
    setSelectedUsers(selectedUsers.length === users.length ? [] : users.map((u) => u.id))
  }

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin"
        title="User Management"
        description="Manage users, roles, subscriptions, and access permissions"
        actions={
          <Button onClick={() => openModal('create')} variant="brand">
            <UserPlus className="h-4 w-4" />
            Add Internal User
          </Button>
        }
      />

      {stats && <AdminUserStatsBar stats={stats} />}

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
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 border border-zinc-200 bg-white px-4 py-2 shadow-sm"
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
        className="overflow-hidden border border-zinc-200 bg-white shadow-sm"
      >
        <AdminUserTable
          users={users}
          isLoading={isLoading}
          selectedUsers={selectedUsers}
          isSuperAdmin={isSuperAdmin}
          actionLoading={actionLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalUsers={totalUsers}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectUser={toggleSelectUser}
          onOpenModal={openModal}
          onPageChange={setCurrentPage}
          onActionLoadingChange={setActionLoading}
          onReload={reload}
        />
      </motion.div>

      <AdminUserModals
        modalType={modalType}
        selectedUser={selectedUser}
        selectedUsers={selectedUsers}
        onClose={closeModal}
        onReload={reload}
        onClearSelectedUsers={() => setSelectedUsers([])}
      />
    </PageShell>
  )
}
