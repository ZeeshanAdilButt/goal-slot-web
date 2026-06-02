'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { JournalAffirmations } from '@/features/journal/components/journal-affirmations'
import { JournalEntryEditor } from '@/features/journal/components/journal-entry-editor'
import { JournalLamp } from '@/features/journal/components/journal-lamp'
import { JournalSidebar } from '@/features/journal/components/journal-sidebar'
import { JournalSun } from '@/features/journal/components/journal-sun'
import { TangleHero } from '@/features/journal/components/tangle-hero'
import { useJournalEntries } from '@/features/journal/hooks/use-journal-entries'
import { CalendarDays, Maximize2, Minimize2, PanelLeft, PanelLeftClose, X } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LampGlow } from '@/components/icons/lamp-glow'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Journal page. Shares the Notes shell pattern (bordered card + chrome row +
 * collapsible left sidebar + editor on the right), so the two writing
 * surfaces feel like siblings while Journal keeps its one-entry-per-day
 * model and Notes keeps its hierarchy + favorites + color core.
 */
export function JournalPage() {
  const isMobile = useIsMobile()
  const { entries, selectedEntry, selectedDate, selectDate, upsertContent, deleteEntry } = useJournalEntries()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Day vs night is driven by the user's local clock — daytime gets
  // the sun (always shining, no toggle), nighttime gets the bedside
  // lamp (off by default; user clicks to turn it on). 6 AM – 6 PM is
  // day. The chosen "fixture" decides which decoration to show.
  const isNight = (() => {
    const h = new Date().getHours()
    return h < 6 || h >= 18
  })()
  // Lamp toggle now controls the dark theme. ON = the journal is a
  // dark room with a warm lamp; OFF = the journal returns to the
  // regular daytime chrome (or whatever theme the user has set
  // globally in Settings). Default OFF so the first frame respects
  // the user's theme; they click the lamp to enter the night room.
  const [lampOn, setLampOn] = useState(false)

  // Dark-mode wiring intentionally disabled per user request. The
  // lamp now stays purely decorative — it does not flip the site
  // theme. The CSS + theme store remain in place so we can re-enable
  // later, but this effect is a no-op for now.
  // (was: setAttribute('data-journal-night', 'true') based on lampOn)

  // Lock body scroll while fullscreen so the user can't accidentally
  // scroll the dashboard chrome behind the overlay. Esc key also
  // exits — standard distraction-free convention.
  useEffect(() => {
    if (!isFullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isFullscreen])
  const today = todayKey()

  const handleSelect = (date: string) => {
    selectDate(date)
    if (isMobile) setIsMobileSidebarOpen(false)
  }

  return (
    <PageShell className="relative overflow-x-hidden">
      {/* LampGlow decoration intentionally removed — the absolutely-
          positioned 420×420 box with a translate-x-24 was bleeding
          past the page edge and triggering horizontal scroll every
          time the lamp toggled. The lamp itself stays as a static
          decoration; no halo overlay. */}

      {/* Time-of-day fixture in the top-right. Daytime → sun shines on
          its own (no toggle, slow ray rotation). Nighttime → bedside
          lamp, clickable to turn on/off the ambient page glow. Only
          one is visible at a time. */}
      {isNight ? (
        <div className="pointer-events-none absolute -top-3 right-1 z-10 hidden sm:right-3 sm:block">
          <JournalLamp on={lampOn} onToggle={() => setLampOn((v) => !v)} />
        </div>
      ) : (
        <div className="pointer-events-none absolute -top-4 right-2 z-10 hidden sm:block">
          <JournalSun className="h-40 w-40" />
        </div>
      )}

      <PageHeader
        eyebrow="Reflect"
        title="Journal"
        description="One free-form entry per day. Just start typing. It autosaves, and the Coach uses it when reading your week."
      />

      <div className="-mt-1 flex flex-wrap items-center gap-3 text-[14px] font-medium text-[#8a7307]">
        <TangleHero className="h-12 w-56 shrink-0 sm:h-16 sm:w-72" />
        <span className="italic">
          <JournalAffirmations />
        </span>
        <span aria-hidden className="inline-block h-px w-6 bg-[#f2cc0d]/60" />
        <span className="text-[11px] uppercase tracking-wider text-zinc-400">
          Your safe space
        </span>
      </div>

      {(() => {
        const editorCard = (
      <div
        className={cn(
          'relative z-10 flex flex-col overflow-hidden border border-zinc-200 bg-white text-zinc-900 shadow-sm',
          isFullscreen
            ? 'h-[100dvh] w-full max-w-none rounded-none border-0'
            : 'h-[calc(100vh-13rem)] min-h-[480px] rounded-xl backdrop-blur-[2px]',
        )}
      >
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-2">
          {/* Entries toggle hidden in fullscreen — there's no sidebar
              to toggle when the editor takes the whole viewport. */}
          {!isFullscreen ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                isMobile
                  ? setIsMobileSidebarOpen((o) => !o)
                  : setIsSidebarCollapsed((c) => !c)
              }
              aria-label={
                isMobile
                  ? isMobileSidebarOpen
                    ? 'Close entries'
                    : 'Open entries'
                  : isSidebarCollapsed
                    ? 'Show entries'
                    : 'Hide entries'
              }
            >
              {(isMobile ? isMobileSidebarOpen : !isSidebarCollapsed) ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
              <span className="text-xs">
                {isMobile
                  ? isMobileSidebarOpen
                    ? 'Close'
                    : 'Entries'
                  : isSidebarCollapsed
                    ? 'Show entries'
                    : 'Hide entries'}
              </span>
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {selectedEntry && (
              <span className="truncate text-xs text-zinc-500">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen((v) => !v)}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen writing'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen writing'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              <span className="text-xs">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </Button>
          </div>
        </div>

        <div className="relative flex flex-1 overflow-hidden">
          {isMobile ? (
            <>
              <div
                className={cn(
                  'absolute inset-y-0 left-0 z-20 flex w-[min(85vw,300px)] flex-col border-r transition-transform duration-200',
                  'border-zinc-200 bg-white',
                  isMobileSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
                )}
              >
                <div className="h-full overflow-y-auto p-3">
                  <JournalSidebar entries={entries} selectedDate={selectedDate} onSelect={handleSelect} onDelete={deleteEntry} />
                </div>
              </div>
              {isMobileSidebarOpen && (
                <button
                  aria-label="Close sidebar"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="absolute inset-0 z-10 bg-zinc-950/30 backdrop-blur-[2px]"
                />
              )}
            </>
          ) : (
            // Sidebar is hidden entirely in fullscreen mode so the
            // editor gets the whole viewport. Otherwise honours the
            // user's collapse toggle as before.
            !isFullscreen && (
              <div
                className={cn(
                  'shrink-0 border-r transition-[width,colors] duration-200',
                  'border-zinc-200 bg-white',
                  isSidebarCollapsed && 'overflow-hidden border-r-0',
                )}
                style={{ width: isSidebarCollapsed ? 0 : 240 }}
              >
                <div className="h-full overflow-y-auto p-3">
                  <JournalSidebar entries={entries} selectedDate={selectedDate} onSelect={handleSelect} onDelete={deleteEntry} />
                </div>
              </div>
            )
          )}

          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col overflow-y-auto',
              isFullscreen
                ? 'mx-auto w-full max-w-5xl px-6 py-6 sm:px-12 sm:py-10'
                : 'p-3 sm:p-4',
            )}
          >
            <JournalEntryEditor entry={selectedEntry} onSaveContent={upsertContent} />
          </div>
        </div>
      </div>
        )

        // In fullscreen we portal the editor card to document.body
        // wrapped in a fixed overlay. Portaling escapes any ancestor
        // transform / filter / overflow that breaks position:fixed,
        // and lets us reliably cover the dashboard chrome + lamp /
        // banners with a single solid surface. A prominent floating
        // Close button sits at top-right of the overlay so the user
        // always has a visible escape (in addition to Esc).
        if (isFullscreen) {
          if (typeof document === 'undefined') return null
          return createPortal(
            <div className="fixed inset-0 z-[1000] flex h-[100dvh] w-screen bg-white">
              {editorCard}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                aria-label="Exit fullscreen (Esc)"
                title="Exit fullscreen (Esc)"
                className="fixed right-4 top-4 z-[1010] inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-900 shadow-lg transition-colors hover:bg-zinc-50"
              >
                <X className="h-4 w-4" />
                Exit fullscreen
                <span className="hidden text-[11px] font-medium text-zinc-400 sm:inline">Esc</span>
              </button>
            </div>,
            document.body,
          )
        }
        return editorCard
      })()}
    </PageShell>
  )
}
