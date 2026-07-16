'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  Download,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Share2,
  Shield,
  Flag,
  Sparkles,
  Users,
} from 'lucide-react'

import { CoachIcon } from '@/components/icons/coach-icon'
import { FeatherPenIcon } from '@/components/icons/feather-pen-icon'
import { JournalSpark } from '@/components/icons/journal-spark'
import { NotebookIcon } from '@/components/icons/notebook-icon'

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
// routine (flushSync) allows react to do the render and compile at the same time
import { flushSync } from 'react-dom'

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
  { href: '/dashboard/notes', label: 'Notes', icon: NotebookIcon },
  { href: '/dashboard/whiteboards', label: 'Whiteboards', icon: LayoutGrid },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/reports/export', label: 'Export Reports', icon: Download },
  { href: '/dashboard/sharing', label: 'Sharing', icon: Share2 },
  { href: '/dashboard/library', label: 'Library', icon: BookOpen },
]

const adminNavItems = [
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/dashboard/admin/release-notes', label: 'Release Notes', icon: Megaphone },
]

interface AppSidebarProps {
  onOpenChangelog?: () => void
  hasUnseenChangelog?: boolean
}

export function AppSidebar({ onOpenChangelog, hasUnseenChangelog }: AppSidebarProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const isAdmin = useIsAdmin()
  const { insights: proposedInsights } = useCoachInsights('PROPOSED')
  const proposedCount = proposedInsights.length
  const { state, isMobile, setOpenMobile } = useSidebar()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const isCollapsed = state === 'collapsed'
  const shouldShowPopover = isCollapsed && !isMobile

  /* this routine makes the sidebar to close when clicked on the page in the mobile screens,handling the mobile sidebar navigation's */
  const handleMobileSidebarNav = () => {
    if (isMobile) {
      flushSync(() => {
        setOpenMobile(false)
      })
    }
  }

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
        <div className="flex w-full items-center justify-between gap-2">
          <Link href="/dashboard" className="shrink-0 group-data-[collapsible=icon]:hidden" onClick={handleMobileSidebarNav}>
            <GoalSlotBrand size="sm" showTagline={false} />
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-1 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1.5">
            <button
              onClick={onOpenChangelog}
              className="relative hidden h-8 w-8 shrink-0 items-center justify-center 
              rounded-md text-zinc-500 transition-colors duration-200 animate-in fade-in zoom-in hover:bg-zinc-100 md:flex"
              title="What's New"
              aria-label="What's New changelog"
            >
              <Sparkles className="h-4 w-4" />
              {hasUnseenChangelog && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#f2cc0d] ring-1 ring-white" />
              )}
            </button>
            <SidebarTrigger className="h-8 w-8 shrink-0 rounded-md text-zinc-500 hover:bg-zinc-100" />
          </div>
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
                      <Link href={item.href} onClick={handleMobileSidebarNav}>
                        {isJournal ? (
                          // Journal pen: brand-yellow with a soft glow,
                          // static (no animation) in the sidebar because
                          // a constantly-tilting nav icon competes for
                          // attention against the floating journal button
                          // (which keeps its tilt animation as the moment).
                          <item.icon
                            className={cn(
                              'h-4 w-4 text-[#f2cc0d] [filter:drop-shadow(0_0_3px_rgba(242,204,13,0.55))] group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5',
                              isActive && 'text-[#f2cc0d]',
                            )}
                          />
                        ) : isCoach ? (
                          // GoalSlot AI: the wrapper now claims the SAME
                          // 4x4 layout box as every other lucide nav icon
                          // so the column of icons (and labels next to
                          // them) lines up exactly. The icon itself
                          // remains visually larger via absolute
                          // positioning + overflow-visible so the brand
                          // moment doesn't get lost. Sparks stay absolute.
                          <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center [overflow:visible] group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5">
                            <item.icon
                              className={cn(
                                'absolute h-6 w-6 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7 [filter:drop-shadow(0_0_4px_rgba(242,204,13,0.6))]',
                              )}
                            />
                            <JournalSpark className="absolute -right-1.5 -top-1.5 h-2 w-2 motion-safe:animate-[journal-spark_3s_ease-in-out_infinite]" />
                            <JournalSpark
                              className="absolute -left-1.5 top-0 h-1.5 w-1.5 motion-safe:animate-[journal-spark_3s_ease-in-out_infinite]"
                              style={{ animationDelay: '1s' }}
                            />
                            <JournalSpark
                              className="absolute -bottom-1.5 right-0 h-1.5 w-1.5 motion-safe:animate-[journal-spark_3s_ease-in-out_infinite]"
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
                        <Link href={item.href} onClick={handleMobileSidebarNav}>
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white ring-2 ring-zinc-100 transition-all hover:bg-zinc-800"
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
