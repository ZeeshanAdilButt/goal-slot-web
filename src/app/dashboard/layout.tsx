'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { motion } from 'framer-motion'

import { useAuthStore } from '@/lib/store'
import { GoalSlotSpinner } from '@/components/goalslot-logo'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { TimeEntryBanner } from '@/components/time-entry-banner'
import { ReleaseNoteBanner } from '@/features/release-notes/components/release-note-banner'

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
      <div className="flex min-h-screen items-center justify-center bg-brutalist-bg">
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
      <SidebarInset className="flex flex-col bg-brutalist-bg">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b-3 border-secondary px-4 md:hidden">
          <SidebarTrigger className="h-10 w-10 border-3 border-secondary !bg-primary !text-secondary shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:!bg-primary hover:shadow-brutal-hover active:translate-x-1 active:translate-y-1 active:shadow-none" />
        </div>
        <TimeEntryBanner />
        <ReleaseNoteBanner />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-h-full pb-32">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-brutalist-bg">
        <GoalSlotSpinner size="xl" />
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}
