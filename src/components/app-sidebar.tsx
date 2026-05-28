'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import {
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  Download,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Share2,
  Shield,
  Flag,
  Users,
} from 'lucide-react'

import { CoachIcon } from '@/components/icons/coach-icon'
import { FeatherPenIcon } from '@/components/icons/feather-pen-icon'
import { JournalSpark } from '@/components/icons/journal-spark'

import { useAuthStore, useIsAdmin } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useCoachInsights } from '@/features/coach/hooks/use-coach-insights'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { GoalSlotBrand } from '@/components/goalslot-logo'
import { SidebarFooterContent } from '@/components/sidebar-footer-content'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  // Planning pair: Goals + Schedule. Decide what matters, allocate time for it.
  { href: '/dashboard/goals', label: 'Goals', icon: Flag },
  { href: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  // Execution pair: Tasks + Time Tracker. Do the work, measure it.
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/time-tracker', label: 'Time Tracker', icon: Clock },
  // Reflection pair: Journal + Coach. Write your day, let the Coach analyse + remind.
  { href: '/dashboard/journal', label: 'Journal', icon: FeatherPenIcon },
  { href: '/dashboard/coach', label: 'GoalSlot AI', icon: CoachIcon },
  // Auxiliary surfaces.
  { href: '/dashboard/notes', label: 'Notes', icon: FileText },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/reports/export', label: 'Export Reports', icon: Download },
  { href: '/dashboard/sharing', label: 'Sharing', icon: Share2 },
]

const adminNavItems = [
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/dashboard/admin/release-notes', label: 'Release Notes', icon: Megaphone },
]

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const isAdmin = useIsAdmin()
  const { insights: proposedInsights } = useCoachInsights('PROPOSED')
  const proposedCount = proposedInsights.length
  const { state, isMobile } = useSidebar()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const isCollapsed = state === 'collapsed'
  const shouldShowPopover = isCollapsed && !isMobile

  const activeNavHref = useMemo(() => {
    const matchingItem = navItems
      .filter((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
      .sort((a, b) => b.href.length - a.href.length)[0]
    return matchingItem?.href
  }, [pathname])

  const handleLogout = () => {
    logout()
    setPopoverOpen(false)
    const returnUrl =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : '/dashboard'
    window.location.href = `/login?redirect=${encodeURIComponent(returnUrl)}`
  }

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-zinc-200 p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="group-data-[collapsible=icon]:hidden">
            <GoalSlotBrand size="md" tagline="Your growth, measured." />
          </Link>
          <SidebarTrigger className="ml-auto h-8 w-8 rounded-md hover:bg-zinc-100 text-zinc-500 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:ml-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto px-2 py-2 group-data-[collapsible=icon]:p-2">
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const isActive = item.href === activeNavHref
                const showCoachBadge = item.href === '/dashboard/coach' && proposedCount > 0
                const isJournal = item.href === '/dashboard/journal'
                const isCoach = item.href === '/dashboard/coach'

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-8"
                    >
                      <Link href={item.href}>
                        {isJournal ? (
                          // Journal: pen sits inside the brand-yellow aura
                          // ring that pulses on a 2s beat, and the pen itself
                          // tilts up a few degrees on the same beat — a soft
                          // nudge toward writing without breaking the calm.
                          <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full motion-safe:animate-[coach-aura_2s_ease-in-out_infinite] group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5">
                            <item.icon
                              className={cn(
                                'h-4 w-4 origin-bottom-left motion-safe:animate-[pen-tilt_2s_ease-in-out_infinite] group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5',
                                isActive && 'text-[#f2cc0d]',
                              )}
                            />
                          </span>
                        ) : isCoach ? (
                          // GoalSlot AI: bigger than the other lucide nav
                          // icons; coin-flips every 2s and is surrounded by
                          // three tiny brand-yellow stars twinkling on
                          // staggered 3s delays so a spark fires every ~1s.
                          <span className="relative inline-flex h-6 w-6 items-center justify-center group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                            <item.icon
                              className={cn(
                                'h-6 w-6 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7 [filter:drop-shadow(0_0_4px_rgba(242,204,13,0.6))] motion-safe:animate-[coach-spin-pause_2s_ease-in-out_infinite]',
                              )}
                            />
                            <JournalSpark className="absolute -right-1 -top-1 h-2 w-2 motion-safe:animate-[journal-spark_3s_ease-in-out_infinite]" />
                            <JournalSpark
                              className="absolute -left-1 top-1 h-1.5 w-1.5 motion-safe:animate-[journal-spark_3s_ease-in-out_infinite]"
                              style={{ animationDelay: '1s' }}
                            />
                            <JournalSpark
                              className="absolute -bottom-1 right-0 h-1.5 w-1.5 motion-safe:animate-[journal-spark_3s_ease-in-out_infinite]"
                              style={{ animationDelay: '2s' }}
                            />
                          </span>
                        ) : (
                          <item.icon
                            className={cn(
                              'h-4 w-4 group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5',
                              isActive && 'text-[#f2cc0d]',
                            )}
                          />
                        )}
                        <span className="text-sm group-data-[collapsible=icon]:hidden">{item.label}</span>
                        {showCoachBadge && (
                          <Badge
                            variant="brand"
                            className="ml-auto h-4 text-[10px] group-data-[collapsible=icon]:hidden"
                          >
                            {proposedCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-data-[collapsible=icon]:hidden">
              <Shield className="h-3 w-3" />
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {adminNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className="h-8"
                      >
                        <Link href={item.href}>
                          <item.icon
                            className={cn(
                              'h-4 w-4 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5',
                              isActive && 'text-[#f2cc0d]',
                            )}
                          />
                          <span className="text-sm group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-200 p-3 group-data-[collapsible=icon]:p-2">
        {shouldShowPopover ? (
          <div className="flex justify-center">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-zinc-100 bg-zinc-900 text-white text-sm font-semibold transition-all hover:bg-zinc-800"
                  aria-label="User menu"
                >
                  {user?.name?.charAt(0) || 'U'}
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="end"
                className="w-72 rounded-xl border border-zinc-200 bg-white shadow-lg"
              >
                <SidebarFooterContent onLogout={handleLogout} />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <SidebarFooterContent onLogout={handleLogout} />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
