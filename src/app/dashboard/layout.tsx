'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ReleaseNoteBanner } from '@/features/release-notes/components/release-note-banner'
import { motion } from 'framer-motion'

import { useAuthStore } from '@/lib/store'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { GoalSlotSpinner } from '@/components/goalslot-logo'
import { FocusNowBar } from '@/components/focus-now-bar'
import { TimeEntryBanner } from '@/components/time-entry-banner'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isLoading, isAuthenticated, loadUser } = useAuthStore()

  const returnTo = useMemo(() => {
    const search = searchParams?.toString()
    return search ? `${pathname}?${search}` : pathname
  }, [pathname, searchParams])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(returnTo || '/dashboard')}`)
    }
  }, [isLoading, isAuthenticated, router, returnTo])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <GoalSlotSpinner size="xl" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-[#fafafa]">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-4 md:hidden">
          <SidebarTrigger className="h-9 w-9 rounded-md hover:bg-zinc-100 text-zinc-700" />
        </div>
        <TimeEntryBanner />
        <FocusNowBar />
        <ReleaseNoteBanner />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
          <GoalSlotSpinner size="xl" />
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
