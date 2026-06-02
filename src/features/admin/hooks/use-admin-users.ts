'use client'

import { useEffect, useState } from 'react'

import { toast } from 'react-hot-toast'

import { usersApi } from '@/lib/api'

import type { AdminUser, AdminUserStats } from '../utils/types'

export function useAdminUsers(currentPage: number, debouncedSearch: string) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminUserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

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

  const reload = () => {
    loadUsers()
    loadStats()
  }

  useEffect(() => {
    loadUsers()
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch])

  return { users, stats, isLoading, totalPages, totalUsers, reload }
}
