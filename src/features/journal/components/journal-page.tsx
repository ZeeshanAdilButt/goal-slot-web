'use client'

import { useState } from 'react'

import { JournalEntryEditor } from '@/features/journal/components/journal-entry-editor'
import { JournalSidebar } from '@/features/journal/components/journal-sidebar'
import { useJournalEntries } from '@/features/journal/hooks/use-journal-entries'
import { CalendarDays, PanelLeft, PanelLeftClose } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  const { entries, selectedEntry, selectedDate, selectDate, upsertContent } = useJournalEntries()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const today = todayKey()

  const handleSelect = (date: string) => {
    selectDate(date)
    if (isMobile) setIsMobileSidebarOpen(false)
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Reflect"
        title="Journal"
        description="One free-form entry per day. Just start typing. It autosaves, and the Coach uses it when reading your week."
        actions={
          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={() => handleSelect(today)}
          >
            <CalendarDays className="h-4 w-4" />
            Today
          </Button>
        }
      />

      <div className="flex h-[calc(100vh-13rem)] min-h-[480px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-2">
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
          {selectedEntry && (
            <span className="truncate text-xs text-zinc-500">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        <div className="relative flex flex-1 overflow-hidden">
          {isMobile ? (
            <>
              <div
                className={cn(
                  'absolute inset-y-0 left-0 z-20 flex w-[min(85vw,300px)] flex-col border-r border-zinc-200 bg-white transition-transform duration-200',
                  isMobileSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
                )}
              >
                <div className="h-full overflow-y-auto p-3">
                  <JournalSidebar entries={entries} selectedDate={selectedDate} onSelect={handleSelect} />
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
            <div
              className={cn(
                'shrink-0 border-r border-zinc-200 bg-white transition-[width] duration-200',
                isSidebarCollapsed && 'overflow-hidden border-r-0',
              )}
              style={{ width: isSidebarCollapsed ? 0 : 240 }}
            >
              <div className="h-full overflow-y-auto p-3">
                <JournalSidebar entries={entries} selectedDate={selectedDate} onSelect={handleSelect} />
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4">
            <JournalEntryEditor entry={selectedEntry} onSaveContent={upsertContent} />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
