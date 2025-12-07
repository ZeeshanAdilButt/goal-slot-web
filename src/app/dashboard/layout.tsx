'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Zap, LayoutDashboard, Target, Calendar, Clock, 
  FileText, BarChart3, Settings, LogOut, Users, Shield, Share2
} from 'lucide-react'
import { useAuthStore, useIsAdmin } from '@/lib/store'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/dashboard/time-tracker', label: 'Time Tracker', icon: Clock },
  { href: '/dashboard/weekly-log', label: 'Weekly Log', icon: FileText },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/sharing', label: 'Sharing', icon: Share2 },
]

const adminNavItems = [
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <div className="min-h-screen bg-brutalist-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 bg-primary border-3 border-secondary flex items-center justify-center"
        >
          <Zap className="w-8 h-8" />
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-brutalist-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brutalist-bg border-r-3 border-secondary flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b-3 border-secondary">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary border-3 border-secondary shadow-brutal flex items-center justify-center">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <span className="font-display font-bold text-lg uppercase tracking-tight">DevWeekends</span>
              <span className="block text-xs font-mono uppercase text-gray-600">Time Master</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  isActive ? 'nav-item-active' : 'nav-item'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <div className="flex items-center gap-2 px-4 text-xs font-bold uppercase text-gray-500">
                  <Shield className="w-4 h-4" />
                  Admin
                </div>
              </div>
              {adminNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      isActive ? 'nav-item-active' : 'nav-item'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t-3 border-secondary">
          <div className="card-brutal p-4 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary border-2 border-secondary flex items-center justify-center font-bold uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{user.name}</p>
                <p className="text-xs font-mono text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                'badge-brutal text-xs',
                user.plan === 'PRO' || user.unlimitedAccess ? 'bg-primary' : 'bg-gray-100'
              )}>
                {user.plan}
              </span>
              {user.userType === 'INTERNAL' && (
                <span className="badge-brutal bg-accent-blue text-white text-xs">DW</span>
              )}
              {user.role !== 'USER' && (
                <span className="badge-brutal bg-accent-pink text-white text-xs">{user.role}</span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard/settings"
              className="flex-1 btn-brutal-secondary py-2 px-3 text-sm flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 bg-gray-100 border-3 border-secondary py-2 px-3 text-sm flex items-center justify-center gap-2 font-bold uppercase shadow-brutal-sm hover:shadow-brutal transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
