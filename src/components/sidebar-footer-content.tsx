'use client'

import Link from 'next/link'

import { LogOut, Settings } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { useThemeStore } from '@/lib/use-theme'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/user-avatar'
import { useSidebar } from './ui/sidebar'
import { flushSync } from 'react-dom'

interface SidebarFooterContentProps {
  onLogout: () => void
}

export function SidebarFooterContent({ onLogout }: SidebarFooterContentProps) {
  const { user } = useAuthStore()
  const isPro = user?.plan === 'PRO' || user?.unlimitedAccess
  const planLabel = isPro ? 'PRO' : user?.plan || 'FREE'
  const { isMobile, setOpenMobile } = useSidebar()

  /* this routine makes the sidebar to close when clicked on the page in the mobile screens,handling the mobile sidebar navigation's */
  const handleMobileSidebarNav = () => {
    if (isMobile) {
      flushSync(() => {
        setOpenMobile(false)
      })
    }
  }


  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 shadow-sm">
      <Link
        href="/dashboard/settings?tab=profile"
        onClick={handleMobileSidebarNav}
        title={user?.email || user?.name || 'Profile'}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-zinc-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
          {user && <UserAvatar user={user} size="md" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">{user?.name || 'User'}</span>
            <span
              className={cn(
                'shrink-0 rounded px-1.5 py-[1px] text-xs font-bold uppercase tracking-wider',
                isPro ? 'bg-[#fff7d1] text-[#8a7307]' : 'bg-zinc-100 text-zinc-600',
              )}
              title={`Plan: ${planLabel}`}
            >
              {planLabel}
            </span>
          </span>
          <span className="min-w-0 truncate text-[10px] text-zinc-500">{user?.email || ''}</span>
        </span>
      </Link>
      {/* Dark-mode toggle intentionally hidden per user request. Code
          stays in place (toggleTheme / isDark above) so it can be
          re-enabled later without refactoring. */}
      <Link
        href="/dashboard/settings"
        onClick={handleMobileSidebarNav}
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
