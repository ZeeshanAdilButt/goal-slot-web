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
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Share2,
  Shield,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'

import { useAuthStore, useIsAdmin } from '@/lib/store'
import { cn } from '@/lib/utils'
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
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/notes', label: 'Notes', icon: FileText },
  { href: '/dashboard/journal', label: 'Journal', icon: BookOpen },
  { href: '/dashboard/time-tracker', label: 'Time Tracker', icon: Clock },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/reports/export', label: 'Export Reports', icon: Download },
  { href: '/dashboard/coach', label: 'Coach', icon: Sparkles },
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

      <SidebarContent className="flex-1 overflow-y-auto p-4 group-data-[collapsible=icon]:p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.href === activeNavHref

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      size="lg"
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={cn(
                            'h-6 w-6 group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5',
                            isActive && 'text-[#f2cc0d]',
                          )}
                        />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
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
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 px-4 text-xs font-bold uppercase text-gray-500 group-data-[collapsible=icon]:hidden">
              <Shield className="h-4 w-4" />
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        size="lg"
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon
                            className={cn(
                              'h-5 w-5 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6',
                              isActive && 'text-[#f2cc0d]',
                            )}
                          />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
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
