'use client'

import { useState } from 'react'

import { ImportEventsDialog } from '@/features/calendar/components/import-events-dialog'
import { useGoogleCalendar } from '@/features/calendar/hooks/use-google-calendar'
import { CalendarDays, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Loading } from '@/components/ui/loading'
import { SectionHeader } from '@/components/ui/section-header'

export function GoogleCalendarCard() {
  const { connection, connect, disconnect } = useGoogleCalendar()
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false)

  const status = connection.data

  const handleConnect = async () => {
    try {
      window.location.href = await connect.mutateAsync()
    } catch {
      toast.error('Could not start the Google connection')
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync()
      setIsDisconnectOpen(false)
      toast.success('Google Calendar disconnected')
    } catch {
      toast.error('Could not disconnect. Please try again.')
    }
  }

  // The API reports `available: false` when it has no Google Calendar
  // credentials configured. Hiding the card entirely beats offering a Connect
  // button that can only ever 404.
  if (status && !status.available) return null

  const isStale = status?.status === 'stale'

  return (
    <GlassCard padded>
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Google Calendar
          </span>
        }
        action={
          connection.isLoading ? (
            <Badge variant="default">Checking connection...</Badge>
          ) : isStale ? (
            <Badge variant="default">Reconnect needed</Badge>
          ) : status?.connected ? (
            <Badge variant="success">Connected</Badge>
          ) : (
            <Badge variant="default">Not Connected</Badge>
          )
        }
      />

      <p className="mb-4 text-sm text-zinc-600">
        Bring meetings and classes from Google Calendar into your weekly schedule. You pick the calendars, review
        exactly what would be added, and choose which events to import. Nothing is added without your say-so, and
        GoalSlot only ever reads from Google — it never changes your calendar.
      </p>

      {connection.isLoading ? (
        <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <Loading className="h-5 w-5" />
        </div>
      ) : status?.connected ? (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">{status.accountEmail}</h4>
            <p className="text-xs text-zinc-500">
              {status.importedCount > 0
                ? `${status.importedCount} ${status.importedCount === 1 ? 'event' : 'events'} imported so far`
                : 'No events imported yet'}
            </p>
          </div>

          {isStale && (
            <p className="rounded-md border border-amber-100 bg-amber-50 p-2.5 text-xs text-amber-700">
              Google revoked access to this account. Reconnect to import again.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {isStale ? (
              <Button variant="brand" className="flex-1" onClick={handleConnect}>
                Reconnect Google Calendar
              </Button>
            ) : (
              <Button variant="brand" className="flex-1" onClick={() => setIsImportOpen(true)}>
                <Download className="h-3.5 w-3.5" />
                Import events
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setIsDisconnectOpen(true)}
              disabled={disconnect.isPending}
              className="border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100/50 hover:text-rose-700"
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <Button variant="brand" className="w-full" onClick={handleConnect} disabled={connect.isPending}>
            Connect Google Calendar
          </Button>
        </div>
      )}

      <ImportEventsDialog open={isImportOpen} onOpenChange={setIsImportOpen} />

      <AlertDialog open={isDisconnectOpen} onOpenChange={setIsDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              Blocks you already imported stay on your schedule — they are yours now. You will need to reconnect to
              import anything else.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnect.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
              disabled={disconnect.isPending}
            >
              {disconnect.isPending ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  )
}
