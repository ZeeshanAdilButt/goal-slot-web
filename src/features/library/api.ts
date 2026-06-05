import { api } from '@/lib/api'

import type {
  TemplateDefinition,
  TemplateImportOptions,
  TemplateImportResult,
  TemplateSummary,
  TemplateSyncResult,
} from './types'

export async function fetchTemplates(): Promise<TemplateSummary[]> {
  const { data } = await api.get<TemplateSummary[]>('/templates')
  return data
}

export async function fetchTemplate(id: string): Promise<TemplateDefinition> {
  const { data } = await api.get<TemplateDefinition>(`/templates/${id}`)
  return data
}

export async function importTemplate(
  id: string,
  options: TemplateImportOptions,
): Promise<TemplateImportResult> {
  const { data } = await api.post<TemplateImportResult>(
    `/templates/${id}/import`,
    options,
  )
  return data
}

export async function syncTemplate(id: string): Promise<TemplateSyncResult> {
  const { data } = await api.post<TemplateSyncResult>(`/templates/${id}/sync`)
  return data
}
