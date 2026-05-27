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
        description="One free-form entry per day. The coach reads these when analyzing your week."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <JournalSidebar entries={entries} selectedDate={selectedDate} onSelect={selectDate} />
        <div className="min-w-0 overflow-hidden">
          <JournalEntryEditor entry={selectedEntry} onSaveContent={upsertContent} />
        </div>
      </div>
    </PageShell>
  )
}
