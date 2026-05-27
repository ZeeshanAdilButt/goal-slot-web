'use client'

import Link from 'next/link'

import { LogOut, Settings } from 'lucide-react'

import { useAuthStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

interface SidebarFooterContentProps {
  onLogout: () => void
}

export function SidebarFooterContent({ onLogout }: SidebarFooterContentProps) {
  const { user } = useAuthStore()

  const isPro = user?.plan === 'PRO' || user?.unlimitedAccess

  return (
    <>
      <GlassCard padded={false} className="mb-3 p-3">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ring-zinc-100 bg-zinc-900 text-white font-semibold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.name || 'User'}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user?.role !== 'USER' && user?.role && (
                <Badge variant="destructive">{user.role}</Badge>
              )}
              {user?.userType === 'INTERNAL' && <Badge variant="success">DW</Badge>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 pt-3">
          <p className="truncate font-mono text-xs text-zinc-500" title={user?.email}>
            {user?.email || ''}
          </p>
          {isPro ? (
            <Badge variant="brand">PRO</Badge>
          ) : (
            <Badge variant="default">{user?.plan || 'FREE'}</Badge>
          )}
        </div>
      </GlassCard>

      <div className="flex gap-2">
        <Button asChild variant="secondary" size="icon" title="Settings">
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          onClick={onLogout}
          variant="ghost"
          size="icon"
          title="Logout"
          className="flex min-w-0 flex-1 items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">Logout</span>
        </Button>
      </div>
    </>
  )
}
