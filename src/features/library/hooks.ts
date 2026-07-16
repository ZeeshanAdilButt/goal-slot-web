'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchTemplate, fetchTemplates, importTemplate, syncTemplate } from './api'
import type { TemplateImportOptions } from './types'

export const LIBRARY_QUERY_KEY = ['library', 'templates'] as const

export function useTemplates() {
  return useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: fetchTemplates,
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['library', 'template', id],
    queryFn: () => fetchTemplate(id),
    enabled: !!id,
  })
}

// After a successful import the user's goals, schedule, and tasks queries
// are all stale. Invalidate the broad query keys so the UI catches up next
// time the user navigates to one of those pages.
export function useImportTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (options: TemplateImportOptions) => importTemplate(id, options),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      qc.invalidateQueries({ queryKey: ['schedule'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['time-tracker'] })
    },
  })
}

// Sync mutation pulls any newly-curated tasks for templates the user has
// already imported. Only tasks are touched.
export function useSyncTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => syncTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['time-tracker'] })
    },
  })
}
