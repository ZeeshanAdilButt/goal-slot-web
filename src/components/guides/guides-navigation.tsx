'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { LogOut, Settings } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { GoalSlotBrand } from '@/components/goalslot-logo'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function GuidesNavigation() {
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200 bg-white will-change-transform">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/">
          <GoalSlotBrand size="md" tagline="Your growth, measured." />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-bold uppercase transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/#features" className="text-sm font-bold uppercase transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="/#pricing" className="text-sm font-bold uppercase transition-colors hover:text-primary">
            Pricing
          </Link>
          <Link href="/guides" className="text-sm font-bold uppercase text-primary">
            Guides
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && isAuthenticated && user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-3 border border-zinc-200 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-200 bg-primary text-sm font-bold uppercase shadow-sm">
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
                className="w-[calc(100vw-2rem)] max-w-72 border border-zinc-200 bg-white p-3 shadow-sm sm:p-4"
              >
                {/* User Info Section */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-zinc-200 bg-primary text-lg font-bold uppercase shadow-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{user?.name || 'User'}</p>
                    <p className="truncate font-mono text-xs text-gray-500" title={user?.email || undefined}>
                      {user?.email || ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {user?.role !== 'USER' && (
                        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-rose-100 bg-zinc-50 px-1.5 px-2.5 py-0 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                          {user?.role}
                        </span>
                      )}
                      {user?.userType === 'INTERNAL' && (
                        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-sky-100 bg-zinc-50 px-1.5 px-2.5 py-0 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">DW</span>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0 px-2 py-0 text-[10px]',
                          user?.plan === 'PRO' || user?.unlimitedAccess ? 'bg-primary' : 'bg-gray-100',
                        )}
                      >
                        {user?.plan || 'FREE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-3 border-t border-zinc-200/20"></div>

                {/* Buttons Section */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="flex inline-flex items-center justify-center gap-1.5 gap-2 rounded-lg bg-zinc-900 px-2.5 px-4 py-1.5 py-2 text-sm text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Dashboard
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href="/dashboard/settings"
                      className="flex inline-flex h-10 w-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white p-0 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex h-10 w-10 items-center justify-center border border-zinc-200 bg-gray-100 shadow-sm transition-all hover:shadow-sm"
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
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50">
                Login
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50">
                Start Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
