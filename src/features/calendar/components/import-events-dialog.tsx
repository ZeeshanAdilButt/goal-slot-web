'use client'

import { useMemo, useState } from 'react'

import { useGoogleCalendarList, useImportEvents, usePreviewImport } from '@/features/calendar/hooks/use-google-calendar'
import { AlertTriangle, Calendar, Check, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import type { ImportBlockedReason, ImportCandidateDto, ImportResultDto } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loading } from '@/components/ui/loading'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const RANGE_OPTIONS = [
  { label: 'Next 7 days', days: 7 },
  { label: 'Next 30 days', days: 30 },
  { label: 'Next 90 days', days: 90 },
] as const

/**
 * Explains a disabled row. A ScheduleBlock is a weekly template with a bare
 * start and end time, so these three shapes have no representation: they are
 * shown greyed with the reason rather than filtered out, because an event the
 * user can see in Google but not in this list reads as a broken import.
 */
const BLOCKED_LABEL: Record<ImportBlockedReason, string> = {
  'all-day': 'All-day event — no time range to import',
  'spans-midnight': 'Crosses midnight — a weekly block cannot span two days',
  'zero-length': 'No duration',
}

type Step = 'pick' | 'review' | 'done'

function isoAtMidnight(offsetDays: number): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString()
}

/**
 * The review-before-import flow.
 *
 * Step 1 picks calendars and a window. Step 2 shows exactly what would be
 * created — day column, time, how many Google occurrences collapsed into that
 * one weekly slot, and whether it was already imported or collides with an
 * existing block — and imports only the ticked rows. Step 3 reports what
 * actually landed, per event.
 */
export function ImportEventsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState<Step>('pick')
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([])
  const [rangeDays, setRangeDays] = useState<number>(30)
  const [candidates, setCandidates] = useState<ImportCandidateDto[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<ImportResultDto | null>(null)

  const calendars = useGoogleCalendarList(open)
  const preview = usePreviewImport()
  const importEvents = useImportEvents()

  const importable = useMemo(() => candidates.filter((c) => !c.blocked), [candidates])

  const reset = () => {
    setStep('pick')
    setSelectedCalendars([])
    setCandidates([])
    setChecked(new Set())
    setResult(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const toggleCalendar = (id: string) => {
    setSelectedCalendars((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const toggleCandidate = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePreview = async () => {
    try {
      const data = await preview.mutateAsync({
        calendarIds: selectedCalendars,
        from: isoAtMidnight(0),
        to: isoAtMidnight(rangeDays),
      })
      setCandidates(data.candidates)
      // Pre-tick what is safe to import, leaving anything already imported or
      // already conflicting for the user to opt into deliberately.
      setChecked(
        new Set(
          data.candidates
            .filter((c) => !c.blocked && !c.alreadyImported && !c.conflictsWith)
            .map((c) => c.externalEventId),
        ),
      )
      setStep('review')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not read your Google Calendar'))
    }
  }

  const handleImport = async () => {
    const selected = importable.filter((c) => checked.has(c.externalEventId))
    if (selected.length === 0) return

    try {
      const data = await importEvents.mutateAsync(
        selected.map((c) => ({
          externalEventId: c.externalEventId,
          externalCalId: c.externalCalId,
          title: c.title,
          dayOfWeek: c.dayOfWeek,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
      )
      setResult(data)
      setStep('done')
      if (data.imported > 0) {
        toast.success(`Imported ${data.imported} ${data.imported === 1 ? 'event' : 'events'}`)
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Import failed'))
    }
  }

  const checkedImportable = importable.filter((c) => checked.has(c.externalEventId))
  const allChecked = importable.length > 0 && checkedImportable.length === importable.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from Google Calendar</DialogTitle>
          <DialogDescription>
            {step === 'pick' && 'Choose which calendars to look at, and how far ahead.'}
            {step === 'review' && 'Review what would be added to your weekly schedule, then pick the ones you want.'}
            {step === 'done' && 'Here is what happened.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'pick' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Calendars</p>
              {calendars.isLoading ? (
                <div className="flex justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-6">
                  <Loading className="h-5 w-5" />
                </div>
              ) : calendars.isError ? (
                <p className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                  Could not load your calendars. Try reconnecting Google Calendar.
                </p>
              ) : (
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2">
                  {(calendars.data ?? []).map((calendar) => (
                    <label
                      key={calendar.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-50"
                    >
                      <Checkbox
                        checked={selectedCalendars.includes(calendar.id)}
                        onCheckedChange={() => toggleCalendar(calendar.id)}
                      />
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-zinc-200"
                        style={{ backgroundColor: calendar.color ?? '#9CA3AF' }}
                      />
                      <span className="flex-1 truncate text-sm text-zinc-800">{calendar.name}</span>
                      {calendar.primary && <Badge variant="default">Primary</Badge>}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Look ahead</p>
              <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.days}
                    type="button"
                    onClick={() => setRangeDays(option.days)}
                    className={cn(
                      'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                      rangeDays === option.days
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">
                Repeating events are grouped into a single weekly slot, so a longer window does not mean more rows to
                read.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="brand"
                onClick={handlePreview}
                disabled={selectedCalendars.length === 0 || preview.isPending}
              >
                {preview.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading events...
                  </>
                ) : (
                  'Preview events'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            {candidates.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center">
                <Calendar className="mx-auto mb-2 h-6 w-6 text-zinc-400" />
                <p className="text-sm text-zinc-600">No events found in that window.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                    <Checkbox
                      checked={allChecked}
                      onCheckedChange={() =>
                        setChecked(allChecked ? new Set() : new Set(importable.map((c) => c.externalEventId)))
                      }
                    />
                    Select all importable
                  </label>
                  <span className="text-xs text-zinc-500">
                    {checkedImportable.length} of {importable.length} selected
                  </span>
                </div>

                <div className="max-h-80 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200">
                  {candidates.map((candidate) => {
                    const disabled = Boolean(candidate.blocked)
                    return (
                      <label
                        key={candidate.externalEventId}
                        className={cn(
                          'flex items-start gap-3 px-3 py-2.5',
                          disabled ? 'cursor-not-allowed bg-zinc-50/60 opacity-70' : 'cursor-pointer hover:bg-zinc-50',
                        )}
                      >
                        <Checkbox
                          className="mt-0.5"
                          disabled={disabled}
                          checked={checked.has(candidate.externalEventId)}
                          onCheckedChange={() => toggleCandidate(candidate.externalEventId)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="truncate text-sm font-medium text-zinc-900">{candidate.title}</span>
                            {candidate.alreadyImported && <Badge variant="success">Already imported</Badge>}
                            {candidate.occurrences > 1 && (
                              <Badge variant="default">{candidate.occurrences}x repeating</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-zinc-600">
                            {disabled ? (
                              BLOCKED_LABEL[candidate.blocked as ImportBlockedReason]
                            ) : (
                              <>
                                {DAY_NAMES[candidate.dayOfWeek]} {candidate.startTime}
                                {' – '}
                                {candidate.endTime}
                              </>
                            )}
                            <span className="text-zinc-400"> · {candidate.calendarName}</span>
                          </p>
                          {candidate.conflictsWith && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              Overlaps &ldquo;{candidate.conflictsWith}&rdquo;
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStep('pick')}>
                Back
              </Button>
              <Button
                variant="brand"
                onClick={handleImport}
                disabled={checkedImportable.length === 0 || importEvents.isPending}
              >
                {importEvents.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${checkedImportable.length} ${checkedImportable.length === 1 ? 'event' : 'events'}`
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <Check className="h-4 w-4 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                {result.imported} {result.imported === 1 ? 'block' : 'blocks'} added to your schedule.
              </p>
            </div>

            {/* Only the ones that did not land need explaining. */}
            {result.results.some((r) => r.status !== 'imported') && (
              <div className="max-h-56 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200">
                {result.results
                  .filter((r) => r.status !== 'imported')
                  .map((r) => (
                    <div key={r.externalEventId} className="px-3 py-2">
                      <p className="text-sm text-zinc-900">{r.title}</p>
                      <p className="text-xs text-zinc-500">
                        {r.status === 'conflict'
                          ? 'Skipped — that slot is already taken'
                          : r.status === 'skipped'
                            ? 'Skipped — already imported'
                            : (r.message ?? 'Could not import')}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="brand" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function errorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: { message?: string | string[] } } })?.response
  const message = response?.data?.message
  if (Array.isArray(message)) return message[0] ?? fallback
  return message ?? fallback
}
