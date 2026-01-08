'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { motion } from 'framer-motion'

import { useAuthStore } from '@/lib/store'
import { GoalSlotSpinner } from '@/components/goalslot-logo'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { TimeEntryBanner } from '@/components/time-entry-banner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isLoading, isAuthenticated, loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

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
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
