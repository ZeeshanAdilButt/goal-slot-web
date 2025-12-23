'use client'

import Link from 'next/link'

import { LogOut, Settings } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface SidebarFooterContentProps {
  onLogout: () => void
}

export function SidebarFooterContent({ onLogout }: SidebarFooterContentProps) {
  const { user } = useAuthStore()

  return (
    <>
      <div className="card-brutal mb-3 p-1.5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-secondary bg-primary text-lg font-bold uppercase shadow-brutal-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.name || 'User'}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user?.role !== 'USER' && (
                <span className="badge-brutal bg-accent-pink px-1.5 py-0 text-[10px] text-white">{user?.role}</span>
              )}
              {user?.userType === 'INTERNAL' && (
                <span className="badge-brutal bg-accent-blue px-1.5 py-0 text-[10px] text-white">DW</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t-2 border-secondary/10 pt-3">
          <p className="truncate font-mono text-xs text-gray-500" title={user?.email}>
            {user?.email || ''}
          </p>
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

      <div className="flex gap-2">
        <Link
          href="/dashboard/settings"
          className="btn-brutal-secondary flex min-w-0 flex-1 items-center justify-center gap-2 px-2 py-2 text-sm"
          title="Settings"
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="truncate">Settings</span>
        </Link>
        <button
          onClick={onLogout}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 border-3 border-secondary bg-gray-100 px-2 py-2 text-sm font-bold uppercase shadow-brutal-sm transition-all hover:shadow-brutal"
          title="Logout"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">Logout</span>
        </button>
      </div>
    </>
  )
}
