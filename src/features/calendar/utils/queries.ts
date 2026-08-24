import { queryOptions } from '@tanstack/react-query'

import { googleCalendarApi } from '@/lib/api'

export const calendarQueries = {
  root: () => ['google-calendar'] as const,

  connectionKey: () => [...calendarQueries.root(), 'connection'] as const,
  calendarsKey: () => [...calendarQueries.root(), 'calendars'] as const,

  connection: () =>
    queryOptions({
      queryKey: calendarQueries.connectionKey(),
      queryFn: async () => (await googleCalendarApi.getConnection()).data,
    }),

  // Fetched only when the import dialog opens, so a Settings visit does not
  // make a round trip to Google for a list nobody asked for.
  calendars: () =>
    queryOptions({
      queryKey: calendarQueries.calendarsKey(),
      queryFn: async () => (await googleCalendarApi.listCalendars()).data,
    }),
} as const
