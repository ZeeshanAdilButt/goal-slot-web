'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck,
  Crown,
  X,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Calendar,
  BadgeCheck,
  BadgeX
} from 'lucide-react'
import { usersApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

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
    role: 'USER'
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
      case 'SUPER_ADMIN': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'ADMIN': return <ShieldCheck className="w-4 h-4 text-purple-500" />
      case 'MENTOR': return <Shield className="w-4 h-4 text-blue-500" />
      default: return <Users className="w-4 h-4 text-gray-500" />
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

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and access permissions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary border-4 border-black font-bold shadow-brutal hover:shadow-brutal-sm transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Add Internal User
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-4 border-black font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-4 border-black shadow-brutal overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users className="w-16 h-16 mb-4" />
            <p className="font-bold">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold uppercase text-sm">User</th>
                <th className="px-4 py-3 text-left font-bold uppercase text-sm">Role</th>
                <th className="px-4 py-3 text-left font-bold uppercase text-sm">Type</th>
                <th className="px-4 py-3 text-left font-bold uppercase text-sm">Plan</th>
                <th className="px-4 py-3 text-left font-bold uppercase text-sm">Joined</th>
                <th className="px-4 py-3 text-right font-bold uppercase text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary border-2 border-black flex items-center justify-center font-black text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 border-2 font-bold text-xs uppercase",
                      getRoleBadge(user.role)
                    )}>
                      {getRoleIcon(user.role)}
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2 py-1 border-2 font-bold text-xs uppercase",
                      user.userType === 'INTERNAL' 
                        ? 'bg-green-200 text-green-800 border-green-400'
                        : 'bg-gray-200 text-gray-800 border-gray-400'
                    )}>
                      {user.userType}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-1 border-2 font-bold text-xs uppercase",
                        user.plan === 'PRO' || user.hasFreeAccess
                          ? 'bg-primary border-black'
                          : 'bg-gray-200 text-gray-800 border-gray-400'
                      )}>
                        {user.hasFreeAccess ? 'PRO (FREE)' : user.plan}
                      </span>
                      {user.hasFreeAccess && (
                        <BadgeCheck className="w-4 h-4 text-green-500" title="Free access granted" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {actionLoading === user.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {user.hasFreeAccess ? (
                            <button
                              onClick={() => handleRevokeAccess(user.id)}
                              className="p-2 bg-red-100 border-2 border-red-400 hover:bg-red-200 transition-colors"
                              title="Revoke Pro Access"
                            >
                              <BadgeX className="w-4 h-4 text-red-600" />
                            </button>
                          ) : user.plan !== 'PRO' && (
                            <button
                              onClick={() => handleGrantAccess(user.id)}
                              className="p-2 bg-green-100 border-2 border-green-400 hover:bg-green-200 transition-colors"
                              title="Grant Pro Access"
                            >
                              <BadgeCheck className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          {isSuperAdmin && user.role === 'USER' && (
                            <button
                              onClick={() => handlePromote(user.id)}
                              className="p-2 bg-purple-100 border-2 border-purple-400 hover:bg-purple-200 transition-colors"
                              title="Promote to Admin"
                            >
                              <ShieldCheck className="w-4 h-4 text-purple-600" />
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
          <div className="flex items-center justify-between px-4 py-3 border-t-4 border-black bg-gray-50">
            <p className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-black shadow-brutal w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b-4 border-black bg-primary">
                <h2 className="text-xl font-black uppercase">Create Internal User</h2>
                <button onClick={() => setIsModalOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block font-bold mb-2 uppercase text-sm">Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-2 border-4 border-black font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2 uppercase text-sm">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 border-4 border-black font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="john@devweekends.com"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2 uppercase text-sm">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 border-4 border-black font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2 uppercase text-sm">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full px-4 py-2 border-4 border-black font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="USER">User</option>
                    <option value="MENTOR">Mentor</option>
                    {isSuperAdmin && <option value="ADMIN">Admin</option>}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border-4 border-black font-bold hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-primary border-4 border-black font-bold shadow-brutal hover:shadow-brutal-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
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
