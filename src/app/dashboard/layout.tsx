'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { motion } from 'framer-motion'
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Share2,
  Shield,
  Target,
  Users,
  Zap,
} from 'lucide-react'

import { useAuthStore, useIsAdmin } from '@/lib/store'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/time-tracker', label: 'Time Tracker', icon: Clock },
  { href: '/dashboard/weekly-log', label: 'Weekly Log', icon: FileText },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/sharing', label: 'Sharing', icon: Share2 },
]

const adminNavItems = [{ href: '/dashboard/admin/users', label: 'Users', icon: Users }]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated, loadUser, logout } = useAuthStore()
  const isAdmin = useIsAdmin()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brutalist-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="flex h-16 w-16 items-center justify-center border-3 border-secondary bg-primary"
        >
          <Zap className="h-8 w-8" />
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-brutalist-bg">
      {/* Sidebar */}
      <aside className="fixed flex h-full w-64 flex-col border-r-3 border-secondary bg-brutalist-bg">
        {/* Logo */}
        <div className="border-b-3 border-secondary p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-3 border-secondary bg-primary shadow-brutal">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <span className="font-display text-lg font-bold uppercase tracking-tight">DevWeekends</span>
              <span className="block font-mono text-xs uppercase text-gray-600">Time Master</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link key={item.href} href={item.href} className={cn(isActive ? 'nav-item-active' : 'nav-item')}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="pb-2 pt-4">
                <div className="flex items-center gap-2 px-4 text-xs font-bold uppercase text-gray-500">
                  <Shield className="h-4 w-4" />
                  Admin
                </div>
              </div>
              {adminNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href} className={cn(isActive ? 'nav-item-active' : 'nav-item')}>
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="border-t-3 border-secondary p-4">
          <div className="card-brutal mb-3 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-secondary bg-primary font-bold uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <p className="truncate font-mono text-xs text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'badge-brutal text-xs',
                  user.plan === 'PRO' || user.unlimitedAccess ? 'bg-primary' : 'bg-gray-100',
                )}
              >
                {user.plan}
              </span>
              {user.userType === 'INTERNAL' && (
                <span className="badge-brutal bg-accent-blue text-xs text-white">DW</span>
              )}
              {user.role !== 'USER' && (
                <span className="badge-brutal bg-accent-pink text-xs text-white">{user.role}</span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard/settings"
              className="btn-brutal-secondary flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex flex-1 items-center justify-center gap-2 border-3 border-secondary bg-gray-100 px-3 py-2 text-sm font-bold uppercase shadow-brutal-sm transition-all hover:shadow-brutal"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
