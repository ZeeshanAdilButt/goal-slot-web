'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

import { LogOut, Settings } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function Navigation() {
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 bg-white transition-shadow duration-200',
        scrolled ? 'border-b border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icons/goalslot-logo-boxed.svg" alt="GoalSlot" width={32} height={32} className="h-8 w-8" priority />
          <span className="font-display text-xl font-bold tracking-tight text-gray-900">GoalSlot</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
            Methodology
          </a>
          <a href="#features" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
            Pricing
          </a>
          <Link href="/guides" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
            Guides
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && isAuthenticated && user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 transition-colors hover:bg-gray-50">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#f2cc0d] text-xs font-bold text-gray-900">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden text-sm font-medium text-gray-900 md:block">{user?.name || 'User'}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="end"
                className="w-72 rounded-md border border-gray-200 bg-white p-3 shadow-lg"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#f2cc0d] text-base font-bold text-gray-900">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                    <p className="truncate text-xs text-gray-500">{user?.email || ''}</p>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {user?.role !== 'USER' && (
                    <span className="rounded bg-pink-100 px-1.5 py-0.5 text-[10px] font-semibold text-pink-700">
                      {user?.role}
                    </span>
                  )}
                  {user?.userType === 'INTERNAL' && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">DW</span>
                  )}
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                      user?.plan === 'PRO' || user?.unlimitedAccess
                        ? 'bg-[#f2cc0d] text-gray-900'
                        : 'bg-gray-100 text-gray-700',
                    )}
                  >
                    {user?.plan || 'FREE'}
                  </span>
                </div>
                <div className="my-3 border-t border-gray-200" />
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="flex-1 rounded bg-[#f2cc0d] px-3 py-2 text-center text-xs font-semibold text-gray-900 transition hover:bg-[#e0bd0a]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Link href="/login?redirect=/dashboard" className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 md:block">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[#f2cc0d] px-4 py-2 text-sm font-semibold text-gray-900 transition-all hover:scale-[1.02] hover:bg-[#e0bd0a]"
              >
                Start Free
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
