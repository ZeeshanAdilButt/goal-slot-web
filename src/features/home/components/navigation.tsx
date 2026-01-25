'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { LogOut, Settings } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { GoalSlotBrand } from '@/components/goalslot-logo'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function Navigation() {
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b-2 border-secondary bg-background/95 will-change-transform backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <GoalSlotBrand size="md" tagline="Your growth, measured." />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#philosophy" className="text-sm font-semibold transition-colors hover:text-primary">
            Why GoalSlot
          </a>
          <a href="#features" className="text-sm font-semibold transition-colors hover:text-primary">
            Features
          </a>
          <a href="#pricing" className="text-sm font-semibold transition-colors hover:text-primary">
            Pricing
          </a>
          <Link href="/guides" className="text-sm font-semibold transition-colors hover:text-primary">
            Guides
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && isAuthenticated && user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-3 border-3 border-secondary bg-white px-3 py-2 shadow-brutal-sm transition-all hover:shadow-brutal">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-secondary bg-primary text-sm font-bold uppercase shadow-brutal-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden min-w-0 text-left md:block">
                    <p className="truncate text-xs font-bold">{user?.name || 'User'}</p>
                    <p className="truncate font-mono text-[10px] text-gray-500">{user?.email || ''}</p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="end"
                className="w-[calc(100vw-2rem)] max-w-72 border-3 border-secondary bg-white p-3 shadow-brutal sm:p-4"
              >
                {/* User Info Section */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-secondary bg-primary text-lg font-bold uppercase shadow-brutal-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{user?.name || 'User'}</p>
                    <p className="truncate font-mono text-xs text-gray-500" title={user?.email || undefined}>
                      {user?.email || ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {user?.role !== 'USER' && (
                        <span className="badge-brutal bg-accent-pink px-1.5 py-0 text-[10px] text-white">
                          {user?.role}
                        </span>
                      )}
                      {user?.userType === 'INTERNAL' && (
                        <span className="badge-brutal bg-accent-blue px-1.5 py-0 text-[10px] text-white">DW</span>
                      )}
                      <span
                        className={cn(
                          'badge-brutal shrink-0 px-2 py-0 text-[10px]',
                          user?.plan === 'PRO' || user?.unlimitedAccess ? 'bg-primary' : 'bg-gray-100',
                        )}
                      >
                        {user?.plan || 'FREE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-3 border-t-2 border-secondary/20"></div>

                {/* Buttons Section */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="btn-brutal flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs"
                  >
                    Dashboard
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href="/dashboard/settings"
                      className="btn-brutal-secondary flex h-10 w-10 items-center justify-center p-0"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex h-10 w-10 items-center justify-center border-3 border-secondary bg-gray-100 shadow-brutal-sm transition-all hover:shadow-brutal"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Link href="/login?redirect=/dashboard" className="btn-brutal-secondary px-6 py-3 text-sm">
                Login
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 rounded-sm border-2 border-secondary bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-hover active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Start Building
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
