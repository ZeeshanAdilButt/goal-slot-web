'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import {
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Share2,
  Shield,
  Target,
  Users,
} from 'lucide-react'

import { GoalSlotBrand, GoalSlotLogo } from '@/components/goalslot-logo'

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
import { SidebarFooterContent } from '@/components/sidebar-footer-content'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/notes', label: 'Notes', icon: FileText },
  { href: '/dashboard/time-tracker', label: 'Time Tracker', icon: Clock },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/sharing', label: 'Sharing', icon: Share2 },
]

const adminNavItems = [
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/feedback', label: 'Feedback', icon: MessageSquare },
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

  const handleLogout = () => {
    logout()
    setPopoverOpen(false)
    // Refresh page to clear all cached data
    window.location.href = '/'
  }

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r-3 border-secondary bg-brutalist-bg">
      <SidebarHeader className="border-b-3 border-secondary p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Link href="/dashboard" className="group-data-[collapsible=icon]:hidden">
            <GoalSlotBrand size="md" tagline="Your growth, measured." />
          </Link>
          <Link href="/dashboard" className="hidden group-data-[collapsible=icon]:block">
            <GoalSlotLogo size="md" />
          </Link>
          <div className="hidden group-data-[collapsible=icon]:justify-center md:flex">
            <SidebarTrigger className="h-8 w-8 border-3 border-secondary !bg-primary !text-secondary shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:!bg-primary hover:shadow-brutal-hover active:translate-x-1 active:translate-y-1 active:shadow-none" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto p-4 group-data-[collapsible=icon]:p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      size="lg"
                      tooltip={item.label}
                      className={cn(isActive ? 'nav-item-active' : 'nav-item')}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-6 w-6 group-data-[collapsible=icon]:-ml-1 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
                        <span>{item.label}</span>
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
                        className={cn(isActive ? 'nav-item-active' : 'nav-item')}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
                          <span>{item.label}</span>
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

      <SidebarFooter className="border-t-3 border-secondary p-3 group-data-[collapsible=icon]:p-2">
        {shouldShowPopover ? (
          <div className="flex justify-center">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center border-2 border-secondary bg-primary text-sm font-bold uppercase shadow-brutal-sm transition-all hover:shadow-brutal"
                  aria-label="User menu"
                >
                  {user?.name?.charAt(0) || 'U'}
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="end"
                className="w-72 border-3 border-secondary bg-white shadow-brutal"
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
