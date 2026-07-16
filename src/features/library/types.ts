// Mirrors the API's templates.types.ts. Kept in feature-local scope so the
// library page does not become a coupling point for the broader app.

export type TemplateCategory =
  | 'schedule'
  | 'habits'
  | 'goals'
  | 'notes'
  | 'journal'

export interface TemplateScheduleBlock {
  dayOfWeek: number
  startTime: string
  endTime: string
  title: string
  goalRef?: string
  category?: string
}

export interface TemplateGoal {
  ref: string
  title: string
  description?: string
  category?: string
  color: string
}

export interface TemplateTask {
  goalRef?: string
  title: string
  description?: string
  category?: string
  key?: string
}

export interface TemplateSyncResult {
  templateId: string
  tasksAdded: number
  skipped: number
  matched: boolean
}

export interface TemplateSummary {
  id: string
  name: string
  description: string
  source: string
  featured: boolean
  categories: TemplateCategory[]
  blockCount: number
  goalCount: number
  taskCount: number
}

export interface TemplateDefinition {
  id: string
  name: string
  description: string
  longDescription?: string
  source: string
  sourceUrl?: string
  featured: boolean
  categories: TemplateCategory[]
  schedule?: TemplateScheduleBlock[]
  goals?: TemplateGoal[]
  tasks?: TemplateTask[]
}

export interface TemplateImportOptions {
  schedule: boolean
  goals: boolean
  tasks: boolean
  replaceExisting?: boolean
}

export interface TemplateImportResult {
  templateId: string
  goalsCreated: number
  scheduleBlocksCreated: number
  tasksCreated: number
}

export const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  schedule: 'Schedule',
  habits: 'Habits',
  goals: 'Goals',
  notes: 'Notes',
  journal: 'Journal',
}
