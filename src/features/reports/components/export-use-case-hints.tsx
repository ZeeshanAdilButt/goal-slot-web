'use client'

import { FileText, GraduationCap, Receipt } from 'lucide-react'

import { cn } from '@/lib/utils'

const HINTS = [
  {
    id: 'invoicing',
    title: 'For Invoicing',
    icon: Receipt,
    description:
      'Use the Detailed View with billable hours enabled. Export as CSV for spreadsheet compatibility or PDF for professional invoices.',
    accentClass: 'border-l-blue-500',
  },
  {
    id: 'mentors',
    title: 'For Mentors / Teachers',
    icon: GraduationCap,
    description:
      'Summary View grouped by Goal shows progress at a glance. Detailed View provides complete activity logs for thorough review.',
    accentClass: 'border-l-green-600',
  },
  {
    id: 'students',
    title: 'For Students',
    icon: FileText,
    description:
      'Use Detailed View to show daily study sessions. Filter by specific courses or goals to generate assignment progress reports.',
    accentClass: 'border-l-purple-600',
  },
] as const

export function ExportUseCaseHints() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {HINTS.map((hint) => {
        const Icon = hint.icon
        return (
          <div key={hint.id} className={cn('card-brutal border-l-4', hint.accentClass)}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900">
              <Icon className="h-4 w-4 shrink-0" />
              {hint.title}
            </h3>
            <p className="font-mono text-xs text-gray-600 sm:text-sm">{hint.description}</p>
          </div>
        )
      })}
    </div>
  )
}
