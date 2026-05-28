'use client'

import { JournalEntryEditor } from '@/features/journal/components/journal-entry-editor'
import { JournalSidebar } from '@/features/journal/components/journal-sidebar'
import { useJournalEntries } from '@/features/journal/hooks/use-journal-entries'

import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'

export function JournalPage() {
  const { entries, selectedEntry, selectedDate, selectDate, upsertContent } = useJournalEntries()

  return (
    <PageShell>
      <PageHeader
        eyebrow="Reflect"
        title="Journal"
        description="One free-form entry per day. Just start typing. It autosaves, and the Coach uses it when reading your week."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="order-2 lg:order-1">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <JournalSidebar entries={entries} selectedDate={selectedDate} onSelect={selectDate} />
          </div>
        </aside>
        <div className="order-1 min-w-0 lg:order-2">
          <JournalEntryEditor entry={selectedEntry} onSaveContent={upsertContent} />
        </div>
      </div>
    </PageShell>
  )
}
