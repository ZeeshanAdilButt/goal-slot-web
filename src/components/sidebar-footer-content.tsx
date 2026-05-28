'use client'

import Link from 'next/link'

import { LogOut, Settings, User as UserIcon } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface SidebarFooterContentProps {
  onLogout: () => void
}

export function SidebarFooterContent({ onLogout }: SidebarFooterContentProps) {
  const { user } = useAuthStore()

  const isPro = user?.plan === 'PRO' || user?.unlimitedAccess
  const planLabel = isPro ? 'PRO' : user?.plan || 'FREE'
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 shadow-sm">
      <Link
        href="/dashboard/settings/profile"
        title={user?.email || user?.name || 'Profile'}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-zinc-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-zinc-900">
              {user?.name || 'User'}
            </span>
            <span
              className={cn(
                'shrink-0 rounded px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider',
                isPro
                  ? 'bg-[#fff7d1] text-[#8a7307]'
                  : 'bg-zinc-100 text-zinc-600',
              )}
              title={`Plan: ${planLabel}`}
            >
              {planLabel}
            </span>
          </span>
          <span className="truncate text-[10px] text-zinc-500">{user?.email || ''}</span>
        </span>
      </Link>
      <Link
        href="/dashboard/settings"
        title="Settings"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        <Settings className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={onLogout}
        title="Log out"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}
