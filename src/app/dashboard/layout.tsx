'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ReleaseNoteBanner } from '@/features/release-notes/components/release-note-banner'
import { motion } from 'framer-motion'

import { useAuthStore } from '@/lib/store'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useApplyTheme as _useApplyTheme } from '@/lib/use-theme'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { CommandPalette } from '@/components/command-palette'
import { ShortcutsCheatsheet } from '@/components/shortcuts-cheatsheet'
import { DailyCheckinBanner } from '@/components/daily-checkin-banner'
import { GoalSlotSpinner } from '@/components/goalslot-logo'
import { FocusNowBar } from '@/components/focus-now-bar'
import { TimeEntryBanner } from '@/components/time-entry-banner'
import { TipsCorner } from '@/components/tips-corner'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { ChangelogModal, CHANGELOG } from '@/components/changelog-modal'
import { Sparkles } from 'lucide-react'

/* The routine(userIsTyping), handles "?" key by not opening the modal when the user is typing in the input field, textarea or editor */
function userIsTyping(target: EventTarget | null): boolean {
  const editing_line = target as HTMLElement | null
  if (!editing_line) return false
  const tag = editing_line.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || editing_line.isContentEditable
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isLoading, isAuthenticated, loadUser } = useAuthStore()

  const [changelogOpen, setChangelogOpen] = useState(false)
  const [lastSeenChangelogAt, setLastSeenChangelogAt, isChangelogInitialized] = useLocalStorage<string | null>(
    'lastSeenChangelogAt',
    null,
  )

  const hasUnseenChangelog = useMemo(() => {
    if (!isChangelogInitialized) return false
    if (!lastSeenChangelogAt) return true
    return CHANGELOG[0].date > lastSeenChangelogAt
  }, [lastSeenChangelogAt, isChangelogInitialized])

  const handleCloseChangelog = useCallback(() => {
    setChangelogOpen(false)
    setLastSeenChangelogAt(CHANGELOG[0].date)
  }, [setLastSeenChangelogAt])
  // Dark mode wiring intentionally disabled per user request — kept
  // as a comment so the import + hook are obviously load-bearing if
  // we re-enable later. useApplyTheme() was here.

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

  // Global Cmd/Ctrl+K opens the command palette. We swallow the event so
  // the browser's own "search bookmarks" shortcut doesn't fire. Plain `/`
  // is intentionally NOT bound here — too easy to trigger from inputs.
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
      // Cmd/Ctrl+/ opens the shortcuts cheat sheet.
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setCheatsheetOpen((v) => !v)
        return
      }
      // '?' also open's but only when user is not typing in the textfields
      if (e.key === '?' && !userIsTyping(e.target)) {
        e.preventDefault()
        setCheatsheetOpen((v) => !v)
      }

    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const fireStartTracking = useCallback(() => {
    window.dispatchEvent(new CustomEvent('goalslot:start-tracking'))
  }, [])
  const fireOpenCoach = useCallback(() => {
    window.dispatchEvent(new CustomEvent('goalslot:open-coach'))
  }, [])
  const fireOpenCheckin = useCallback(() => {
    // DailyCheckinCard only mounts on /dashboard. Route there so the
    // listener exists, then dispatch on the next tick.
    if (!pathname?.endsWith('/dashboard')) {
      router.push('/dashboard')
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('goalslot:open-checkin'))
      }, 250)
    } else {
      window.dispatchEvent(new CustomEvent('goalslot:open-checkin'))
    }
  }, [pathname, router])

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
      <AppSidebar
        onOpenChangelog={() => setChangelogOpen(true)}
        hasUnseenChangelog={hasUnseenChangelog}
      />
      <SidebarInset className="flex flex-col bg-[#fafafa]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
          <SidebarTrigger className="h-9 w-9 rounded-md hover:bg-zinc-100 text-zinc-700" />
          <button
            onClick={() => setChangelogOpen(true)}
            className="relative h-9 w-9 rounded-md hover:bg-zinc-100 text-zinc-700 flex items-center justify-center transition-colors"
            title="What's New"
            aria-label="What's New changelog"
          >
            <Sparkles className="h-5 w-5" />
            {hasUnseenChangelog && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#f2cc0d] ring-1 ring-white" />
            )}
          </button>
        </div>
        <TimeEntryBanner />
        <FocusNowBar />
        <DailyCheckinBanner />
        <ReleaseNoteBanner />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onStartTracking={fireStartTracking}
        onOpenCoach={fireOpenCoach}
        onOpenCheckin={fireOpenCheckin}
      />
      <ChangelogModal
        isOpen={changelogOpen}
        onClose={handleCloseChangelog}
        lastSeenChangelogAt={lastSeenChangelogAt}
      />
      <ShortcutsCheatsheet open={cheatsheetOpen} onOpenChange={setCheatsheetOpen} />
      <TipsCorner />
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
