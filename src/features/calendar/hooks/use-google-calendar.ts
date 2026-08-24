'use client'

import { calendarQueries } from '@/features/calendar/utils/queries'
import { scheduleQueries } from '@/features/schedule/utils/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { googleCalendarApi, type ImportEventInput } from '@/lib/api'

/**
 * The browser is the only party that knows which week the user means. A Google
 * event at 18:00 UTC is Wednesday 23:00 in Karachi and Wednesday 11:00 in Los
 * Angeles — a different row, and sometimes a different day column — so the zone
 * travels with every preview request rather than being guessed server-side.
 */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function useGoogleCalendar() {
  const queryClient = useQueryClient()
  const connection = useQuery(calendarQueries.connection())

  const invalidateConnection = () => queryClient.invalidateQueries({ queryKey: calendarQueries.root() })

  // Returns the consent URL rather than redirecting, so the caller decides when
  // to leave the page.
  const connect = useMutation({
    mutationFn: async () => (await googleCalendarApi.getConsentUrl()).data.url,
  })

  const disconnect = useMutation({
    mutationFn: () => googleCalendarApi.disconnect(),
    onSuccess: invalidateConnection,
  })

  return { connection, connect, disconnect }
}

/** Lazily loaded: only runs once the import dialog is open. */
export function useGoogleCalendarList(enabled: boolean) {
  return useQuery({ ...calendarQueries.calendars(), enabled })
}

/**
 * The review step. A mutation rather than a query because the user triggers it
 * deliberately (pick calendars, pick a range, press Preview) and because
 * caching a list the user is about to act on would show them stale rows.
 */
export function usePreviewImport() {
  return useMutation({
    mutationFn: async (params: { calendarIds: string[]; from: string; to: string }) =>
      (await googleCalendarApi.preview({ ...params, timeZone: browserTimeZone() })).data,
  })
}

export function useImportEvents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (events: ImportEventInput[]) => (await googleCalendarApi.import(events)).data,
    onSuccess: () => {
      // Importing writes real schedule blocks, so the weekly grid is now stale.
      queryClient.invalidateQueries({ queryKey: scheduleQueries.root() })
      queryClient.invalidateQueries({ queryKey: calendarQueries.root() })
    },
  })
}
