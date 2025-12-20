'use client'

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  BadgeX,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Loader2,
  Mail,
  Search,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import { usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'MENTOR' | 'ADMIN' | 'SUPER_ADMIN'
  userType: 'INTERNAL' | 'EXTERNAL'
  plan: 'FREE' | 'PRO'
  hasFreeAccess: boolean
  createdAt: string
  lastActiveAt?: string
}

interface CreateUserData {
  email: string
  password: string
  name: string
  role: 'USER' | 'MENTOR' | 'ADMIN'
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    role: 'USER',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [currentPage])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const response = await usersApi.listUsers(currentPage, 20)
      setUsers(response.data.users || response.data)
      setTotalPages(response.data.totalPages || 1)
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error('All fields are required')
      return
    }

    setIsCreating(true)
    try {
      await usersApi.createInternal(newUser)
      toast.success('User created successfully')
      setIsModalOpen(false)
      setNewUser({ email: '', password: '', name: '', role: 'USER' })
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user')
    } finally {
      setIsCreating(false)
    }
  }

  const handleGrantAccess = async (userId: string) => {
    setActionLoading(userId)
    try {
      await usersApi.grantAccess(userId)
      toast.success('Pro access granted')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to grant access')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevokeAccess = async (userId: string) => {
    setActionLoading(userId)
    try {
      await usersApi.revokeAccess(userId)
      toast.success('Access revoked')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke access')
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'ADMIN':
        return <ShieldCheck className="h-4 w-4 text-purple-500" />
      case 'MENTOR':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-yellow-200 text-yellow-800 border-yellow-400',
      ADMIN: 'bg-purple-200 text-purple-800 border-purple-400',
      MENTOR: 'bg-blue-200 text-blue-800 border-blue-400',
      USER: 'bg-gray-200 text-gray-800 border-gray-400',
    }
    return colors[role] || colors.USER
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">User Management</h1>
          <p className="mt-1 text-gray-600">Manage users, roles, and access permissions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 border-4 border-black bg-primary px-4 py-2 font-bold shadow-brutal transition-all hover:shadow-brutal-sm"
        >
          <UserPlus className="h-5 w-5" />
          Add Internal User
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border-4 border-black py-3 pl-12 pr-4 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden border-4 border-black bg-white shadow-brutal"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users className="mb-4 h-16 w-16" />
            <p className="font-bold">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase">User</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase">Role</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase">Type</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-bold uppercase">Joined</th>
                <th className="px-4 py-3 text-right text-sm font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-primary text-lg font-black">
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
                        getRoleBadge(user.role),
                      )}
                    >
                      {getRoleIcon(user.role)}
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'border-2 px-2 py-1 text-xs font-bold uppercase',
                        user.userType === 'INTERNAL'
                          ? 'border-green-400 bg-green-200 text-green-800'
                          : 'border-gray-400 bg-gray-200 text-gray-800',
                      )}
                    >
                      {user.userType}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'border-2 px-2 py-1 text-xs font-bold uppercase',
                          user.plan === 'PRO' || user.hasFreeAccess
                            ? 'border-black bg-primary'
                            : 'border-gray-400 bg-gray-200 text-gray-800',
                        )}
                      >
                        {user.hasFreeAccess ? 'PRO (FREE)' : user.plan}
                      </span>
                      {user.hasFreeAccess && <BadgeCheck className="h-4 w-4 text-green-500" />}
                    </div>
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
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          {user.hasFreeAccess ? (
                            <button
                              onClick={() => handleRevokeAccess(user.id)}
                              className="border-2 border-red-400 bg-red-100 p-2 transition-colors hover:bg-red-200"
                              title="Revoke Pro Access"
                            >
                              <BadgeX className="h-4 w-4 text-red-600" />
                            </button>
                          ) : (
                            user.plan !== 'PRO' && (
                              <button
                                onClick={() => handleGrantAccess(user.id)}
                                className="border-2 border-green-400 bg-green-100 p-2 transition-colors hover:bg-green-200"
                                title="Grant Pro Access"
                              >
                                <BadgeCheck className="h-4 w-4 text-green-600" />
                              </button>
                            )
                          )}
                          {isSuperAdmin && user.role === 'USER' && (
                            <button
                              onClick={() => handlePromote(user.id)}
                              className="border-2 border-purple-400 bg-purple-100 p-2 transition-colors hover:bg-purple-200"
                              title="Promote to Admin"
                            >
                              <ShieldCheck className="h-4 w-4 text-purple-600" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t-4 border-black bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium">
              Page {currentPage} of {totalPages}
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

      {/* Create User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md border-4 border-black bg-white shadow-brutal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b-4 border-black bg-primary p-4">
                <h2 className="text-xl font-black uppercase">Create Internal User</h2>
                <button onClick={() => setIsModalOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 p-6">
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
                    placeholder="john@devweekends.com"
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
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value as any })}
                  >
                    <SelectTrigger className="h-auto w-full rounded-none border-4 border-black px-4 py-2 font-medium shadow-none focus:ring-2 focus:ring-primary">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="MENTOR">Mentor</SelectItem>
                      {isSuperAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border-4 border-black px-4 py-2 font-bold transition-colors hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex flex-1 items-center justify-center gap-2 border-4 border-black bg-primary px-4 py-2 font-bold shadow-brutal transition-all hover:shadow-brutal-sm disabled:opacity-50"
                  >
                    {isCreating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
